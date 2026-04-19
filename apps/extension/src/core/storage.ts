import type { AllergenKey, CachedIngredient, LocalSettings } from '@safesnack/shared-types';
import { ALL_ALLERGENS, DEFAULT_SETTINGS } from '@safesnack/shared-types';

const SETTINGS_KEY = 'localSettings' as const;
const CACHE_KEY = 'ingredientCache' as const;

/** Default cache entry lifetime when `ttl` is missing or invalid (30 days). */
const DEFAULT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hasChromeSync(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.sync);
}

function hasChromeLocal(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

const ALLERGEN_SET = new Set<AllergenKey>(ALL_ALLERGENS);

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function isAllergenKeyArray(v: unknown): v is LocalSettings['allergens'] {
  return (
    Array.isArray(v) && v.every((x) => typeof x === 'string' && ALLERGEN_SET.has(x as AllergenKey))
  );
}

function isShowBadgesOn(v: unknown): v is LocalSettings['uiPreferences']['showBadgesOn'] {
  if (!Array.isArray(v)) return false;
  const allowed = new Set(['search', 'pdp', 'cart']);
  return v.every((x) => typeof x === 'string' && allowed.has(x));
}

function mergeLocalSettings(raw: unknown): LocalSettings {
  const d = DEFAULT_SETTINGS();
  if (!raw || typeof raw !== 'object') {
    return d;
  }
  const r = raw as Partial<LocalSettings>;
  const badgeStyle =
    r.uiPreferences?.badgeStyle === 'minimal' || r.uiPreferences?.badgeStyle === 'verbose'
      ? r.uiPreferences.badgeStyle
      : d.uiPreferences.badgeStyle;
  return {
    version: r.version === 1 ? 1 : d.version,
    allergens: isAllergenKeyArray(r.allergens) ? r.allergens : d.allergens,
    customAvoid:
      Array.isArray(r.customAvoid) && r.customAvoid.every((x) => typeof x === 'string')
        ? r.customAvoid
        : d.customAvoid,
    uiPreferences: {
      showBadgesOn: isShowBadgesOn(r.uiPreferences?.showBadgesOn)
        ? r.uiPreferences.showBadgesOn
        : d.uiPreferences.showBadgesOn,
      badgeStyle,
    },
    installedAt: typeof r.installedAt === 'string' ? r.installedAt : d.installedAt,
    onboardingCompleted:
      typeof r.onboardingCompleted === 'boolean' ? r.onboardingCompleted : d.onboardingCompleted,
  };
}

type CacheMap = Record<string, CachedIngredient>;

function normalizeCacheEntry(entry: CachedIngredient): CachedIngredient {
  const ttl = entry.ttl > 0 ? entry.ttl : DEFAULT_CACHE_TTL_MS;
  return { ...entry, ttl };
}

function isExpired(entry: CachedIngredient, now: number): boolean {
  return now > entry.fetchedAt + entry.ttl;
}

async function readCacheMap(): Promise<CacheMap> {
  if (!hasChromeLocal()) {
    return {};
  }
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const raw = result[CACHE_KEY];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as CacheMap;
    }
  } catch {
    // ignore
  }
  return {};
}

async function writeCacheMap(map: CacheMap): Promise<void> {
  if (!hasChromeLocal()) {
    return;
  }
  try {
    await chrome.storage.local.set({ [CACHE_KEY]: map });
  } catch {
    // ignore
  }
}

export async function getSettings(): Promise<LocalSettings> {
  if (!hasChromeSync()) {
    return mergeLocalSettings(null);
  }
  try {
    const stored = await chrome.storage.sync.get(SETTINGS_KEY);
    return mergeLocalSettings(stored[SETTINGS_KEY]);
  } catch {
    return mergeLocalSettings(null);
  }
}

export async function saveSettings(s: Partial<LocalSettings>): Promise<void> {
  if (!hasChromeSync()) {
    return;
  }
  try {
    const current = await getSettings();
    const { uiPreferences: patchUi, ...patchRest } = s;
    const next: LocalSettings = {
      ...current,
      ...omitUndefined(patchRest as Record<string, unknown>),
      uiPreferences: {
        ...current.uiPreferences,
        ...(patchUi ? omitUndefined(patchUi as Record<string, unknown>) : {}),
      },
    };
    await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  } catch {
    // ignore
  }
}

export function subscribeToSettings(cb: (s: LocalSettings) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== 'sync' || !changes[SETTINGS_KEY]) {
      return;
    }
    const change = changes[SETTINGS_KEY];
    cb(mergeLocalSettings(change.newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

export async function getCached(productKey: string): Promise<CachedIngredient | null> {
  if (!productKey) {
    return null;
  }
  const map = await readCacheMap();
  const entry = map[productKey];
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const now = Date.now();
  if (isExpired(entry, now)) {
    return null;
  }
  return entry;
}

export async function setCached(entry: CachedIngredient): Promise<void> {
  if (!hasChromeLocal()) {
    return;
  }
  try {
    const map = await readCacheMap();
    map[entry.productKey] = normalizeCacheEntry(entry);
    await writeCacheMap(map);
  } catch {
    // ignore
  }
}

export async function clearExpiredCache(): Promise<number> {
  if (!hasChromeLocal()) {
    return 0;
  }
  try {
    const map = await readCacheMap();
    const now = Date.now();
    let removed = 0;
    const next: CacheMap = { ...map };
    for (const key of Object.keys(next)) {
      const entry = next[key];
      if (entry && isExpired(entry, now)) {
        delete next[key];
        removed += 1;
      }
    }
    if (removed > 0) {
      await writeCacheMap(next);
    }
    return removed;
  } catch {
    return 0;
  }
}
