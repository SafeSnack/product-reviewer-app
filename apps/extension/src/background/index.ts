import { detectAllergens } from '@safesnack/allergen-engine';
import type { CachedIngredient, DetectionResult, LocalSettings } from '@safesnack/shared-types';
import {
  onMessage,
  type LookupRequest,
  type LookupResponse,
  type Message,
  type SettingsChanged,
} from '../core/messaging.js';
import {
  clearExpiredCache,
  getCached,
  getSettings,
  LOCAL_SETTINGS_STORAGE_KEY,
  setCached,
} from '../core/storage.js';
import { productScanStateFromLookupResponse, trackEvent } from '../services/analytics.js';
import { lookupByName } from '../services/openFoodFacts.js';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_ALARM_NAME = 'safesnack-clear-expired-cache';
const ONBOARDING_URL = 'src/onboarding/index.html';

const inflight = new Map<string, Promise<LookupResponse>>();

function inflightKey(req: LookupRequest): string {
  return req.ingredientsFromDom?.trim()
    ? `${req.productKey}\u0001dom`
    : `${req.productKey}\u0001tile`;
}

function cachedToResult(c: CachedIngredient): DetectionResult {
  return {
    ingredientsFound: true,
    ingredientsText: c.ingredientsText,
    allergens: c.detectedAllergens,
    mayContain: c.mayContain,
    confidence: 0.85,
    source: c.source,
  };
}

async function runLookup(req: LookupRequest): Promise<LookupResponse> {
  const settings = await getSettings();
  const targets = settings.allergens;
  const customAvoid = settings.customAvoid;

  const cached = await getCached(req.productKey);
  if (cached) {
    return {
      type: 'LOOKUP_RESULT',
      productKey: req.productKey,
      result: cachedToResult(cached),
    };
  }

  const domText = req.ingredientsFromDom?.trim();
  if (domText) {
    const result = detectAllergens({
      ingredientsText: domText,
      source: 'amazon_dom',
      targetAllergens: targets,
      customAvoid,
    });
    const entry: CachedIngredient = {
      productKey: req.productKey,
      ingredientsText: result.ingredientsText ?? domText,
      detectedAllergens: result.allergens,
      mayContain: result.mayContain,
      source: 'amazon_dom',
      fetchedAt: Date.now(),
      ttl: CACHE_TTL_MS,
    };
    await setCached(entry);
    return {
      type: 'LOOKUP_RESULT',
      productKey: req.productKey,
      result,
    };
  }

  const off = await lookupByName(req.productName);
  if (!off?.ingredientsText?.trim()) {
    return {
      type: 'LOOKUP_RESULT',
      productKey: req.productKey,
      result: null,
      error: 'not_found',
    };
  }

  const result = detectAllergens({
    ingredientsText: off.ingredientsText,
    source: 'off_api',
    targetAllergens: targets,
    customAvoid,
  });
  const entry: CachedIngredient = {
    productKey: req.productKey,
    ingredientsText: result.ingredientsText ?? off.ingredientsText,
    detectedAllergens: result.allergens,
    mayContain: result.mayContain,
    source: 'off_api',
    fetchedAt: Date.now(),
    ttl: CACHE_TTL_MS,
  };
  await setCached(entry);
  return {
    type: 'LOOKUP_RESULT',
    productKey: req.productKey,
    result,
  };
}

async function handleLookupProduct(req: LookupRequest): Promise<LookupResponse> {
  const key = inflightKey(req);
  let pending = inflight.get(key);
  if (!pending) {
    pending = runLookup(req).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, pending);
  }
  const response = await pending;
  void trackEvent('product_scanned', {
    productKey: req.productKey,
    state: productScanStateFromLookupResponse(response),
  });
  return response;
}

async function broadcastSettingsChanged(settings: LocalSettings): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query || !chrome.tabs?.sendMessage) {
    return;
  }
  const msg: SettingsChanged = { type: 'SETTINGS_CHANGED', settings };
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs.map((tab) =>
      tab.id != null
        ? chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined)
        : Promise.resolve(),
    ),
  );
}

function ensureDailyCacheAlarm(): void {
  if (typeof chrome === 'undefined' || !chrome.alarms?.create) {
    return;
  }
  void chrome.alarms.get(CACHE_ALARM_NAME, (existing) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (!existing) {
      chrome.alarms.create(CACHE_ALARM_NAME, { periodInMinutes: 24 * 60 });
    }
  });
}

function registerInstallAndLifecycle(): void {
  if (typeof chrome === 'undefined') {
    return;
  }

  chrome.runtime.onInstalled.addListener((details) => {
    ensureDailyCacheAlarm();
    if (details.reason === 'install') {
      void trackEvent('extension_installed');
    }
    if (details.reason === 'install' && chrome.tabs?.create && chrome.runtime?.getURL) {
      try {
        void chrome.tabs.create({ url: chrome.runtime.getURL(ONBOARDING_URL) });
      } catch {
        // ignore
      }
    }
  });

  chrome.runtime.onStartup?.addListener(() => {
    ensureDailyCacheAlarm();
  });

  chrome.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name === CACHE_ALARM_NAME) {
      void clearExpiredCache();
    }
  });

  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync' || !changes[LOCAL_SETTINGS_STORAGE_KEY]) {
        return;
      }
      void getSettings().then((s) => broadcastSettingsChanged(s));
    });
  }

  ensureDailyCacheAlarm();
}

registerInstallAndLifecycle();

onMessage(async (message: Message) => {
  if (message.type === 'LOOKUP_PRODUCT') {
    try {
      return await handleLookupProduct(message);
    } catch {
      return {
        type: 'LOOKUP_RESULT',
        productKey: message.productKey,
        result: null,
        error: 'lookup_failed',
      } satisfies LookupResponse;
    }
  }
  return undefined;
});
