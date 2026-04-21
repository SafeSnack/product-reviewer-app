/** Distinct product keys scanned today (local calendar day), in `chrome.storage.session`. */

export const SESSION_SCANS_TODAY_KEY = 'safesnackScansToday' as const;

const MAX_KEYS = 4000;

export type ScansTodayState = {
  date: string;
  keys: string[];
};

export function localCalendarDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function mergeScansToday(
  day: string,
  prev: ScansTodayState | undefined,
  productKey: string,
): ScansTodayState {
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
  if (keys.length > MAX_KEYS) {
    return { date: day, keys: keys.slice(keys.length - MAX_KEYS) };
  }
  return { date: day, keys };
}

function hasSession(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.session);
}

function isScansTodayState(v: unknown): v is ScansTodayState {
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

export async function recordProductScanned(productKey: string): Promise<void> {
  if (!hasSession()) {
    return;
  }
  const day = localCalendarDateKey();
  try {
    const bag = await chrome.storage.session.get(SESSION_SCANS_TODAY_KEY);
    const prev = bag[SESSION_SCANS_TODAY_KEY];
    const next = mergeScansToday(day, isScansTodayState(prev) ? prev : undefined, productKey);
    await chrome.storage.session.set({ [SESSION_SCANS_TODAY_KEY]: next });
  } catch {
    // ignore
  }
}

export async function getScannedTodayCount(): Promise<number> {
  if (!hasSession()) {
    return 0;
  }
  try {
    const bag = await chrome.storage.session.get(SESSION_SCANS_TODAY_KEY);
    const raw = bag[SESSION_SCANS_TODAY_KEY];
    if (!isScansTodayState(raw)) {
      return 0;
    }
    if (raw.date !== localCalendarDateKey()) {
      return 0;
    }
    return raw.keys.length;
  } catch {
    return 0;
  }
}

/** Subscribe to session scan counter updates (same tab context; popup uses this). */
export function subscribeToScannedToday(cb: (count: number) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'session' || !changes[SESSION_SCANS_TODAY_KEY]) {
      return;
    }
    void getScannedTodayCount().then(cb);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
