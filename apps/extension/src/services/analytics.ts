/**
 * Privacy-first analytics: MVP = local `chrome.storage.session` counters only.
 * v2 (opt-in + PostHog URL in env): remote capture stubbed here — no `fetch` in MVP paths.
 */

import { badgeStateFromDetection } from '@safesnack/allergen-engine';
import type { DetectionResult } from '@safesnack/shared-types';
import type { LookupResponse } from '../core/messaging.js';
import { getSettings } from '../core/storage.js';
import { ANALYTICS_OPT_IN_DEFAULT, isPostHogCaptureConfigured } from '../env.js';

export const ANALYTICS_SESSION_KEY = 'safesnackAnalyticsSession' as const;
/** Legacy key from pre-analytics scan counter; migrated once into {@link ANALYTICS_SESSION_KEY}. */
const LEGACY_SCANS_TODAY_KEY = 'safesnackScansToday' as const;

const MAX_SCAN_KEYS = 4000;

export type AnalyticsEventName =
  | 'extension_installed'
  | 'onboarding_completed'
  | 'product_scanned'
  | 'pdp_viewed'
  | 'submission_created';

export type ProductScanState = 'safe' | 'unsafe' | 'unknown';

export type ScansTodayBucket = {
  date: string;
  keys: string[];
};

export type AnalyticsSessionState = {
  scansToday: ScansTodayBucket;
  unsafeShown: number;
  submissionsThisSession: number;
};

export type AnalyticsSessionCounters = {
  scansToday: number;
  unsafeShown: number;
  submissionsThisSession: number;
};

export function localCalendarDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Merge distinct product keys for the current local calendar day. */
export function mergeScansTodayBucket(
  day: string,
  prev: ScansTodayBucket | undefined,
  productKey: string,
): ScansTodayBucket {
  const key = productKey.trim();
  if (!key) {
    return prev?.date === day && prev.keys.length > 0 ? prev : { date: day, keys: [] };
  }
  if (!prev || prev.date !== day) {
    return { date: day, keys: [key] };
  }
  if (prev.keys.includes(key)) {
    return prev;
  }
  const keys = [...prev.keys, key];
  if (keys.length > MAX_SCAN_KEYS) {
    return { date: day, keys: keys.slice(keys.length - MAX_SCAN_KEYS) };
  }
  return { date: day, keys };
}

export function productScanStateFromResult(
  result: DetectionResult | null | undefined,
): ProductScanState {
  return badgeStateFromDetection(result);
}

export function productScanStateFromLookupResponse(res: LookupResponse): ProductScanState {
  if (res.type !== 'LOOKUP_RESULT') {
    return 'unknown';
  }
  return productScanStateFromResult(res.result ?? undefined);
}

function hasSession(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.session);
}

function isScansTodayBucket(v: unknown): v is ScansTodayBucket {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const o = v as Record<string, unknown>;
  return (
    typeof o.date === 'string' &&
    Array.isArray(o.keys) &&
    o.keys.every((x) => typeof x === 'string')
  );
}

function isAnalyticsSessionState(v: unknown): v is AnalyticsSessionState {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const o = v as Record<string, unknown>;
  return (
    isScansTodayBucket(o.scansToday) &&
    typeof o.unsafeShown === 'number' &&
    Number.isFinite(o.unsafeShown) &&
    typeof o.submissionsThisSession === 'number' &&
    Number.isFinite(o.submissionsThisSession)
  );
}

type LegacyScans = { date: string; keys: string[] };

function isLegacyScans(v: unknown): v is LegacyScans {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const o = v as Record<string, unknown>;
  return (
    typeof o.date === 'string' &&
    Array.isArray(o.keys) &&
    o.keys.every((x) => typeof x === 'string')
  );
}

function emptyState(day: string): AnalyticsSessionState {
  return {
    scansToday: { date: day, keys: [] },
    unsafeShown: 0,
    submissionsThisSession: 0,
  };
}

/** Roll scan bucket forward when calendar day changes; keep other session counters. */
function rollScanBucketIfNeeded(state: AnalyticsSessionState, day: string): AnalyticsSessionState {
  if (state.scansToday.date === day) {
    return state;
  }
  return {
    ...state,
    scansToday: { date: day, keys: [] },
  };
}

async function readRawSession(): Promise<unknown> {
  if (!hasSession()) {
    return undefined;
  }
  try {
    const bag = await chrome.storage.session.get([ANALYTICS_SESSION_KEY, LEGACY_SCANS_TODAY_KEY]);
    return bag[ANALYTICS_SESSION_KEY];
  } catch {
    return undefined;
  }
}

async function migrateLegacyScansIfNeeded(
  day: string,
  state: AnalyticsSessionState,
): Promise<AnalyticsSessionState> {
  if (!hasSession()) {
    return state;
  }
  try {
    const bag = await chrome.storage.session.get(LEGACY_SCANS_TODAY_KEY);
    const legacy = bag[LEGACY_SCANS_TODAY_KEY];
    if (!isLegacyScans(legacy)) {
      return state;
    }
    let next = state;
    if (legacy.date === day) {
      for (const k of legacy.keys) {
        next = {
          ...next,
          scansToday: mergeScansTodayBucket(day, next.scansToday, k),
        };
      }
    }
    await chrome.storage.session.remove(LEGACY_SCANS_TODAY_KEY);
    await chrome.storage.session.set({ [ANALYTICS_SESSION_KEY]: next });
    return next;
  } catch {
    return state;
  }
}

async function loadState(day: string): Promise<AnalyticsSessionState> {
  const raw = await readRawSession();
  let base: AnalyticsSessionState;
  if (isAnalyticsSessionState(raw)) {
    base = rollScanBucketIfNeeded(raw, day);
  } else {
    base = emptyState(day);
  }
  return migrateLegacyScansIfNeeded(day, base);
}

async function persistState(state: AnalyticsSessionState): Promise<void> {
  if (!hasSession()) {
    return;
  }
  try {
    await chrome.storage.session.set({ [ANALYTICS_SESSION_KEY]: state });
  } catch {
    // ignore
  }
}

/**
 * v2 remote capture: gated on env URL + user opt-in. MVP ships with no `fetch` here
 * (remote path intentionally omitted until product/legal sign-off).
 */
async function maybeSendRemoteCapture(
  event: AnalyticsEventName,
  props?: Record<string, string | number>,
): Promise<void> {
  if (!isPostHogCaptureConfigured()) {
    return;
  }
  const settings = await getSettings();
  const optedIn = settings.analyticsOptIn ?? ANALYTICS_OPT_IN_DEFAULT;
  if (!optedIn) {
    return;
  }
  // v2: POST JSON to PostHog `POSTHOG_CAPTURE_URL` with anonymous payload. MVP: no `fetch`.
  void event;
  void props;
}

/**
 * Record an analytics event. MVP: updates session counters only; never calls network.
 */
export async function trackEvent(
  event: AnalyticsEventName,
  props?: Record<string, string | number>,
): Promise<void> {
  const day = localCalendarDateKey();
  let state = await loadState(day);

  switch (event) {
    case 'product_scanned': {
      const pk = typeof props?.productKey === 'string' ? props.productKey.trim() : '';
      const st = props?.state;
      const scanState =
        st === 'safe' || st === 'unsafe' || st === 'unknown' ? (st as ProductScanState) : undefined;
      if (!pk || !scanState) {
        break;
      }
      state = {
        ...state,
        scansToday: mergeScansTodayBucket(day, state.scansToday, pk),
        unsafeShown: scanState === 'unsafe' ? state.unsafeShown + 1 : state.unsafeShown,
      };
      await persistState(state);
      break;
    }
    case 'submission_created': {
      state = {
        ...state,
        submissionsThisSession: state.submissionsThisSession + 1,
      };
      await persistState(state);
      break;
    }
    case 'extension_installed':
    case 'onboarding_completed':
    case 'pdp_viewed':
    default:
      break;
  }

  await maybeSendRemoteCapture(event, props);
}

export async function getSessionCounters(): Promise<AnalyticsSessionCounters> {
  const day = localCalendarDateKey();
  const s = await loadState(day);
  return {
    scansToday: s.scansToday.date === day ? s.scansToday.keys.length : 0,
    unsafeShown: s.unsafeShown,
    submissionsThisSession: s.submissionsThisSession,
  };
}

export function subscribeToSessionCounters(cb: (c: AnalyticsSessionCounters) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'session') {
      return;
    }
    if (!changes[ANALYTICS_SESSION_KEY] && !changes[LEGACY_SCANS_TODAY_KEY]) {
      return;
    }
    void getSessionCounters().then(cb);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
