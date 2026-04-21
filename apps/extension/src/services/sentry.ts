import * as Sentry from '@sentry/browser';

import { SENTRY_DSN, SENTRY_ENV, SENTRY_THROW_ON_START } from '../env.js';

/** Regexes for host-page noise we never want billed as SafeSnack bugs. */
export const AMAZON_DOM_NOISE_PATTERNS: readonly RegExp[] = [
  /ResizeObserver loop limit exceeded/i,
  /ResizeObserver loop completed with undelivered notifications/i,
  /Non-Error promise rejection captured/i,
  /^Script error\.?$/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
  /AbortError: The user aborted a request/i,
  /The play\(\) request was interrupted/i,
];

const MAX_EXCEPTION_MESSAGE_LEN = 500;
const MAX_BREADCRUMB_MESSAGE_LEN = 240;

export type SentryExtensionContext = 'background' | 'content';

type LooseEvent = {
  request?: { url?: string; query_string?: unknown; data?: unknown; headers?: unknown };
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Array<{
    message?: string;
    data?: Record<string, unknown>;
    category?: string;
  }>;
  exception?: {
    values?: Array<{
      value?: string;
      type?: string;
      stacktrace?: { frames?: Array<{ filename?: string; abs_path?: string }> };
    }>;
  };
};

function stripQueryIfHttpUrl(s: string): string {
  if (!/^https?:\/\//i.test(s)) {
    return s;
  }
  try {
    const u = new URL(s);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    const q = s.indexOf('?');
    const h = s.indexOf('#');
    const cut = Math.min(q === -1 ? s.length : q, h === -1 ? s.length : h);
    return s.slice(0, cut);
  }
}

function truncateLong(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}…[truncated]`;
}

function scrubStringField(s: string): string {
  return truncateLong(stripQueryIfHttpUrl(s), MAX_EXCEPTION_MESSAGE_LEN);
}

/** Exported for unit tests — mutates event in place for PII minimization. */
export function scrubSentryEventForPrivacy(event: LooseEvent): void {
  if (event.request) {
    if (typeof event.request.url === 'string') {
      event.request.url = stripQueryIfHttpUrl(event.request.url);
    }
    delete event.request.query_string;
    delete event.request.data;
    delete event.request.headers;
  }
  if (event.tags) {
    for (const [k, v] of Object.entries(event.tags)) {
      if (typeof v === 'string' && /url|href|path|referrer|page/i.test(k)) {
        event.tags[k] = stripQueryIfHttpUrl(v);
      }
    }
  }
  if (event.extra) {
    delete event.extra;
  }
  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      if (/react|redux|vue|angular|browser|device/i.test(key)) {
        delete event.contexts[key];
      }
    }
  }
  for (const ex of event.exception?.values ?? []) {
    if (typeof ex.value === 'string') {
      ex.value = scrubStringField(ex.value);
    }
    for (const fr of ex.stacktrace?.frames ?? []) {
      if (typeof fr.filename === 'string') {
        fr.filename = stripQueryIfHttpUrl(fr.filename);
      }
      if (typeof fr.abs_path === 'string') {
        fr.abs_path = stripQueryIfHttpUrl(fr.abs_path);
      }
    }
  }
  for (const bc of event.breadcrumbs ?? []) {
    if (typeof bc.message === 'string') {
      bc.message = truncateLong(stripQueryIfHttpUrl(bc.message), MAX_BREADCRUMB_MESSAGE_LEN);
    }
    if (bc.data) {
      delete bc.data;
    }
  }
}

/** Exported for unit tests. */
export function shouldDropKnownAmazonDomNoise(event: LooseEvent): boolean {
  const parts: string[] = [];
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) {
      parts.push(ex.value);
    }
    if (ex.type) {
      parts.push(ex.type);
    }
  }
  const blob = parts.join('\n');
  return AMAZON_DOM_NOISE_PATTERNS.some((re) => re.test(blob));
}

function extensionVersion(): string {
  try {
    const v = chrome.runtime?.getManifest?.()?.version;
    return typeof v === 'string' && v.length > 0 ? v : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Initializes Sentry for extension contexts. Call once per JS world (background SW, content).
 * DSN empty → no-op (MVP local builds without secrets).
 */
export function initSentry(context: SentryExtensionContext): void {
  const g = globalThis as { __safesnackSentryInit?: boolean };
  if (!SENTRY_DSN || g.__safesnackSentryInit) {
    return;
  }
  g.__safesnackSentryInit = true;

  const version = extensionVersion();

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: `safesnack@${version}`,
    dist: context,
    /** Required for content scripts on https origins (Sentry blocks mixed extension+page by default). */
    skipBrowserExtensionCheck: context === 'content',
    sendDefaultPii: false,
    autoSessionTracking: false,
    sendClientReports: false,
    maxBreadcrumbs: 30,
    sampleRate: 1,
    tracesSampleRate: context === 'content' ? 0.1 : 0,
    integrations: (integrations) => {
      const next = integrations.filter(
        (i) => i.name !== 'HttpContext' && i.name !== 'BrowserSession',
      );
      if (context === 'content') {
        return [...next, Sentry.browserTracingIntegration({ instrumentNavigation: true })];
      }
      return next;
    },
    ignoreErrors: [...AMAZON_DOM_NOISE_PATTERNS],
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'ui.click' || breadcrumb.category === 'ui.input') {
        return null;
      }
      if (typeof breadcrumb.message === 'string') {
        return {
          ...breadcrumb,
          message: truncateLong(
            stripQueryIfHttpUrl(breadcrumb.message),
            MAX_BREADCRUMB_MESSAGE_LEN,
          ),
          data: undefined,
        };
      }
      return { ...breadcrumb, data: undefined };
    },
    beforeSend(event) {
      const e = event as LooseEvent;
      if (shouldDropKnownAmazonDomNoise(e)) {
        return null;
      }
      scrubSentryEventForPrivacy(e);
      return event;
    },
  });

  Sentry.setTag('extension_context', context);

  if (SENTRY_THROW_ON_START && context === 'background') {
    setTimeout(() => {
      throw new Error('safesnack-sentry-background-test');
    }, 0);
  }
}
