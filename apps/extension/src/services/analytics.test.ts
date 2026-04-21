import { describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@safesnack/shared-types';
import {
  ANALYTICS_SESSION_KEY,
  localCalendarDateKey,
  mergeScansTodayBucket,
  productScanStateFromResult,
  trackEvent,
} from './analytics.js';

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: chrome.storage.AreaName,
) => void;

describe('analytics', () => {
  it('mergeScansTodayBucket dedupes and rolls forward', () => {
    const prev = { date: '2000-01-01', keys: ['amazon:A'] };
    const next = mergeScansTodayBucket('2026-04-21', prev, 'amazon:B');
    expect(next).toEqual({ date: '2026-04-21', keys: ['amazon:B'] });
  });

  it('productScanStateFromResult matches badge semantics', () => {
    const unknown: DetectionResult = {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 1,
      source: 'amazon_dom',
    };
    expect(productScanStateFromResult(unknown)).toBe('unknown');

    const lowConf: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'x',
      allergens: [],
      mayContain: [],
      confidence: 0.2,
      source: 'amazon_dom',
    };
    expect(productScanStateFromResult(lowConf)).toBe('unknown');

    const unsafe: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'milk',
      allergens: ['milk'],
      mayContain: [],
      confidence: 1,
      source: 'amazon_dom',
    };
    expect(productScanStateFromResult(unsafe)).toBe('unsafe');

    const safe: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'water',
      allergens: [],
      mayContain: [],
      confidence: 1,
      source: 'amazon_dom',
    };
    expect(productScanStateFromResult(safe)).toBe('safe');

    const mayOnly: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'sugar. may contain peanuts.',
      allergens: [],
      mayContain: ['peanut'],
      confidence: 0.6,
      source: 'amazon_dom',
    };
    expect(productScanStateFromResult(mayOnly)).toBe('unknown');
  });

  it('trackEvent updates session counters for product_scanned and submission_created', async () => {
    const sessionData: Record<string, unknown> = {};
    const listeners = new Set<StorageListener>();

    vi.stubGlobal('chrome', {
      storage: {
        session: {
          get: vi.fn(async (keys?: string | string[]) => {
            if (typeof keys === 'string') {
              return { [keys]: sessionData[keys] };
            }
            if (Array.isArray(keys)) {
              const out: Record<string, unknown> = {};
              for (const k of keys) {
                out[k] = sessionData[k];
              }
              return out;
            }
            return { ...sessionData };
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(items)) {
              sessionData[k] = v;
            }
            const changes: Record<string, chrome.storage.StorageChange> = {};
            for (const k of Object.keys(items)) {
              changes[k] = { oldValue: undefined, newValue: items[k] };
            }
            for (const l of listeners) {
              l(changes, 'session');
            }
          }),
          remove: vi.fn(async (keys: string | string[]) => {
            const list = typeof keys === 'string' ? [keys] : keys;
            for (const k of list) {
              delete sessionData[k];
            }
          }),
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
    } as unknown as typeof chrome);

    const day = localCalendarDateKey();
    await trackEvent('product_scanned', {
      productKey: 'amazon:TESTASIN01',
      state: 'unsafe',
    });
    const raw = sessionData[ANALYTICS_SESSION_KEY] as {
      scansToday: { date: string; keys: string[] };
      unsafeShown: number;
      submissionsThisSession: number;
    };
    expect(raw.scansToday.date).toBe(day);
    expect(raw.scansToday.keys).toContain('amazon:TESTASIN01');
    expect(raw.unsafeShown).toBe(1);

    await trackEvent('submission_created');
    const raw2 = sessionData[ANALYTICS_SESSION_KEY] as { submissionsThisSession: number };
    expect(raw2.submissionsThisSession).toBe(1);

    vi.unstubAllGlobals();
  });
});
