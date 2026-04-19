import type { AllergenKey, BadgeState, DetectionResult } from '@safesnack/shared-types';
import { sendMessage } from '../core/messaging.js';
import type { LookupResponse } from '../core/messaging.js';
import { getSettings } from '../core/storage.js';
import { mountBadge, updateBadge } from './badge.js';
import { mountPdpUi } from './highlighter.js';
import { startTileObserver } from './observer.js';
import {
  AMAZON_SELECTORS,
  extractIngredientsFromPdp,
  findPdpIngredientsMountPoint,
  firstMatch,
} from './selectors/amazon.js';

const pageDisposers: Array<() => void> = [];
let spaHooksReady = false;
let spaDebounceId: ReturnType<typeof globalThis.setTimeout> | undefined;

/** Public for tests — maps the current URL to extension surface mode. */
export function classifyAmazonPage(href: string): 'search' | 'pdp' | 'other' {
  try {
    const u = new URL(href, 'https://www.amazon.com');
    const p = u.pathname.toLowerCase();
    if (/(?:\/dp\/|\/gp\/product\/)[a-z0-9]{10}/i.test(p)) {
      return 'pdp';
    }
    if (
      p === '/s' ||
      p.startsWith('/s/') ||
      p.startsWith('/gp/browse') ||
      p.startsWith('/gp/b/') ||
      p.startsWith('/b/')
    ) {
      return 'search';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

function extractAmazonProductAsin(href: string): string | null {
  const m = href.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|\?|$)/i);
  return m?.[1]?.toUpperCase() ?? null;
}

function isProfileActive(settings: {
  allergens: readonly AllergenKey[];
  customAvoid: readonly string[];
}): boolean {
  return settings.allergens.length > 0 || settings.customAvoid.length > 0;
}

function detectionToBadgeState(result: DetectionResult | null | undefined): BadgeState {
  if (!result || !result.ingredientsFound) {
    return 'unknown';
  }
  if (result.confidence < 0.5) {
    return 'unknown';
  }
  if (result.allergens.length > 0) {
    return 'unsafe';
  }
  return 'safe';
}

function clearPageResources(): void {
  while (pageDisposers.length > 0) {
    const d = pageDisposers.pop();
    try {
      d?.();
    } catch {
      // Never let teardown throw.
    }
  }
}

function scheduleBootstrap(): void {
  globalThis.clearTimeout(spaDebounceId);
  spaDebounceId = globalThis.setTimeout(() => {
    spaDebounceId = undefined;
    void bootstrapAmazonFresh();
  }, 280);
}

function ensureSpaHooks(): void {
  if (spaHooksReady) {
    return;
  }
  spaHooksReady = true;
  globalThis.addEventListener('popstate', () => scheduleBootstrap());
  const title = document.querySelector('title');
  if (title) {
    new MutationObserver(() => scheduleBootstrap()).observe(title, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  }
  new MutationObserver(() => scheduleBootstrap()).observe(document.head, {
    subtree: true,
    childList: true,
  });
}

function startSearchFlow(): void {
  const disposeObserver = startTileObserver({
    selectors: AMAZON_SELECTORS,
    onTile(tile, asin, title) {
      try {
        const productKey = `amazon:${asin}`;
        mountBadge(tile, { state: 'unknown', allergens: [], mayContain: [] });
        void (async () => {
          try {
            const res = await sendMessage<LookupResponse>({
              type: 'LOOKUP_PRODUCT',
              productKey,
              productName: title,
            });
            if (
              !tile.isConnected ||
              res.type !== 'LOOKUP_RESULT' ||
              res.productKey !== productKey
            ) {
              return;
            }
            const state = detectionToBadgeState(res.result ?? undefined);
            updateBadge(tile, {
              state,
              allergens: res.result?.allergens ?? [],
              mayContain: res.result?.mayContain ?? [],
            });
          } catch {
            try {
              updateBadge(tile, { state: 'unknown', allergens: [], mayContain: [] });
            } catch {
              // ignore
            }
          }
        })();
      } catch {
        // per-tile isolation
      }
    },
  });
  pageDisposers.push(disposeObserver);
}

async function startPdpFlow(): Promise<void> {
  const asin = extractAmazonProductAsin(location.href);
  const title =
    firstMatch(document, [...AMAZON_SELECTORS.pdpTitle])
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? '';
  const ingredients = extractIngredientsFromPdp();
  if (!asin || !ingredients?.trim()) {
    return;
  }
  const productKey = `amazon:${asin}`;
  try {
    const res = await sendMessage<LookupResponse>({
      type: 'LOOKUP_PRODUCT',
      productKey,
      productName: title,
      ingredientsFromDom: ingredients,
    });
    if (res.type !== 'LOOKUP_RESULT' || !res.result) {
      return;
    }
    const container = findPdpIngredientsMountPoint();
    if (!container) {
      return;
    }
    const disposeUi = mountPdpUi({
      insertBefore: container,
      highlightRoot: container,
      detection: res.result,
    });
    pageDisposers.push(disposeUi);
  } catch {
    // PDP flow must never break the host page.
  }
}

/** Bootstraps SafeSnack for the current Amazon URL (search vs PDP). Safe to call on every SPA navigation. */
export async function bootstrapAmazonFresh(): Promise<void> {
  clearPageResources();

  try {
    const settings = await getSettings();
    if (!isProfileActive(settings)) {
      ensureSpaHooks();
      return;
    }

    const kind = classifyAmazonPage(location.href);
    if (import.meta.env.DEV && kind === 'search') {
      void import('./selectors/amazon.js')
        .then((m) => {
          try {
            m.logSelectorCoverage();
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    }

    if (kind === 'search') {
      try {
        startSearchFlow();
      } catch {
        // ignore
      }
    } else if (kind === 'pdp') {
      try {
        await startPdpFlow();
      } catch {
        // ignore
      }
    }
  } catch {
    // settings / chrome unavailable — idle
  }

  ensureSpaHooks();
}

function kickoff(): void {
  void bootstrapAmazonFresh();
}

function installSettingsBroadcastListener(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
    return;
  }
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== 'object') {
      return;
    }
    const t = (message as { type?: unknown }).type;
    if (t !== 'SETTINGS_CHANGED') {
      return;
    }
    try {
      void bootstrapAmazonFresh();
    } catch {
      // ignore
    }
  });
}

if (import.meta.env.MODE !== 'test') {
  installSettingsBroadcastListener();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kickoff, { once: true });
  } else {
    kickoff();
  }
}
