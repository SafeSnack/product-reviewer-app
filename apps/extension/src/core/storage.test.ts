import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CachedIngredient } from '@safesnack/shared-types';

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: chrome.storage.AreaName,
) => void;

function createChromeStorageMock(): {
  chrome: typeof chrome;
  syncStore: Record<string, unknown>;
  localStore: Record<string, unknown>;
} {
  const syncStore: Record<string, unknown> = {};
  const localStore: Record<string, unknown> = {};
  const listeners = new Set<StorageListener>();

  function notify(
    area: chrome.storage.AreaName,
    key: string,
    oldValue: unknown,
    newValue: unknown,
  ): void {
    const changes: Record<string, chrome.storage.StorageChange> = {
      [key]: { oldValue, newValue },
    };
    for (const l of listeners) {
      l(changes, area);
    }
  }

  const chromeMock = {
    storage: {
      sync: {
        get: async (keys?: string | string[] | Record<string, unknown> | null) => {
          if (keys == null) {
            return { ...syncStore };
          }
          if (typeof keys === 'string') {
            return { [keys]: syncStore[keys] };
          }
          if (Array.isArray(keys)) {
            const out: Record<string, unknown> = {};
            for (const k of keys) {
              out[k] = syncStore[k];
            }
            return out;
          }
          return { ...syncStore };
        },
        set: async (items: Record<string, unknown>) => {
          for (const key of Object.keys(items)) {
            const oldValue = syncStore[key];
            syncStore[key] = items[key];
            notify('sync', key, oldValue, items[key]);
          }
        },
      },
      local: {
        get: async (keys?: string | string[] | Record<string, unknown> | null) => {
          if (keys == null) {
            return { ...localStore };
          }
          if (typeof keys === 'string') {
            return { [keys]: localStore[keys] };
          }
          if (Array.isArray(keys)) {
            const out: Record<string, unknown> = {};
            for (const k of keys) {
              out[k] = localStore[k];
            }
            return out;
          }
          return { ...localStore };
        },
        set: async (items: Record<string, unknown>) => {
          for (const key of Object.keys(items)) {
            const oldValue = localStore[key];
            localStore[key] = items[key];
            notify('local', key, oldValue, items[key]);
          }
        },
      },
      onChanged: {
        addListener: (cb: StorageListener) => {
          listeners.add(cb);
        },
        removeListener: (cb: StorageListener) => {
          listeners.delete(cb);
        },
      },
    },
  } as unknown as typeof chrome;

  return { chrome: chromeMock, syncStore, localStore };
}

describe('storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  beforeEach(() => {
    vi.resetModules();
  });

  it('first read returns defaults when sync is empty', async () => {
    const { chrome } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { getSettings } = await import('./storage.js');
    const s = await getSettings();
    expect(s.version).toBe(1);
    expect(s.allergens).toEqual([]);
    expect(s.onboardingCompleted).toBe(false);
    expect(s.analyticsOptIn).toBe(false);
    expect(s.uiPreferences.badgeStyle).toBe('minimal');
  });

  it('merges partial persisted settings with defaults (schema upgrade)', async () => {
    const { chrome, syncStore } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    syncStore.localSettings = { onboardingCompleted: true };
    const { getSettings } = await import('./storage.js');
    const s = await getSettings();
    expect(s.onboardingCompleted).toBe(true);
    expect(s.uiPreferences.showBadgesOn).toEqual(['search', 'pdp']);
    expect(Array.isArray(s.allergens)).toBe(true);
  });

  it('write + read round-trip for settings', async () => {
    const { chrome } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { getSettings, saveSettings } = await import('./storage.js');
    await saveSettings({ onboardingCompleted: true, customAvoid: ['coconut'] });
    const s = await getSettings();
    expect(s.onboardingCompleted).toBe(true);
    expect(s.customAvoid).toEqual(['coconut']);
  });

  it('subscribe fires on sync change and unsubscribe stops callbacks', async () => {
    const { chrome } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { saveSettings, subscribeToSettings } = await import('./storage.js');
    const cb = vi.fn();
    const unsub = subscribeToSettings(cb);
    await saveSettings({ onboardingCompleted: true });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ onboardingCompleted: true }));
    unsub();
    await saveSettings({ onboardingCompleted: false });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('getCached returns null for missing or empty key', async () => {
    const { chrome } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { getCached } = await import('./storage.js');
    expect(await getCached('missing')).toBeNull();
    expect(await getCached('')).toBeNull();
  });

  it('setCached + getCached round-trip', async () => {
    const { chrome } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { getCached, setCached } = await import('./storage.js');
    const now = Date.now();
    const entry: CachedIngredient = {
      productKey: 'asin-1',
      ingredientsText: 'milk',
      detectedAllergens: ['milk'],
      mayContain: [],
      source: 'off_api',
      fetchedAt: now,
      ttl: 60_000,
    };
    await setCached(entry);
    const read = await getCached('asin-1');
    expect(read).not.toBeNull();
    expect(read!.ingredientsText).toBe('milk');
  });

  it('getCached returns null when expired; clearExpiredCache removes entries', async () => {
    const { chrome, localStore } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { getCached, setCached, clearExpiredCache } = await import('./storage.js');
    const entry: CachedIngredient = {
      productKey: 'old',
      ingredientsText: 'x',
      detectedAllergens: [],
      mayContain: [],
      source: 'amazon_dom',
      fetchedAt: 0,
      ttl: 1,
    };
    await setCached(entry);
    expect(await getCached('old')).toBeNull();
    const removed = await clearExpiredCache();
    expect(removed).toBe(1);
    expect(localStore.ingredientCache).toEqual({});
    expect(await clearExpiredCache()).toBe(0);
    expect(await getCached('old')).toBeNull();
  });

  it('applies default 30-day ttl when ttl is invalid', async () => {
    const { chrome, localStore } = createChromeStorageMock();
    vi.stubGlobal('chrome', chrome);
    const { setCached } = await import('./storage.js');
    const now = Date.now();
    await setCached({
      productKey: 'p',
      ingredientsText: '',
      detectedAllergens: [],
      mayContain: [],
      source: 'usda',
      fetchedAt: now,
      ttl: 0,
    });
    const map = localStore.ingredientCache as Record<string, CachedIngredient>;
    expect(map.p.ttl).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
