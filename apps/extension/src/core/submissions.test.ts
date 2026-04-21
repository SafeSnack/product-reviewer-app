import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CachedIngredient } from '@safesnack/shared-types';

describe('submissions', () => {
  const localStore: Record<string, unknown> = {};
  const chromeMock = {
    storage: {
      sync: {
        get: vi.fn(async () => ({})),
      },
      local: {
        get: vi.fn(async (keys?: string | string[]) => {
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
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(localStore, items);
        }),
      },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    for (const k of Object.keys(localStore)) {
      delete localStore[k];
    }
    vi.stubGlobal('chrome', chromeMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queueSubmission appends and getQueuedSubmissions reads back', async () => {
    const { queueSubmission, getQueuedSubmissions } = await import('./submissions.js');
    await queueSubmission({
      productKey: 'amazon:B0TEST0001',
      productName: 'Test Snack',
      ingredientsText: 'Oats, sugar, may contain nuts.',
    });
    const rows = await getQueuedSubmissions();
    expect(rows.length).toBe(1);
    expect(rows[0]?.productKey).toBe('amazon:B0TEST0001');
    expect(rows[0]?.status).toBe('queued');
  });

  it('getHelpedProductCount counts distinct product keys', async () => {
    const { queueSubmission, getHelpedProductCount } = await import('./submissions.js');
    await queueSubmission({
      productKey: 'amazon:A',
      productName: 'A',
      ingredientsText: 'water, salt',
    });
    await queueSubmission({
      productKey: 'amazon:A',
      productName: 'A2',
      ingredientsText: 'water, sugar',
    });
    await queueSubmission({
      productKey: 'amazon:B',
      productName: 'B',
      ingredientsText: 'milk',
    });
    expect(await getHelpedProductCount()).toBe(2);
  });

  it('queueSubmission writes ingredient cache entry', async () => {
    const { queueSubmission } = await import('./submissions.js');
    const { getCached } = await import('./storage.js');
    await queueSubmission({
      productKey: 'amazon:CACHE1',
      productName: 'X',
      ingredientsText: 'Contains milk and soy.',
    });
    const cached = await getCached('amazon:CACHE1');
    expect(cached).not.toBeNull();
    expect((cached as CachedIngredient).source).toBe('user_submission');
  });
});
