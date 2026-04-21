/**
 * Manual QA (real network): temporarily point `globalThis.fetch` at native fetch and call
 * `lookupByName('Cheerios Honey Nut')` from a devtools snippet — expect non-null when OFF has a hit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const offMocks = vi.hoisted(() => ({
  isNameMiss: vi.fn().mockResolvedValue(false),
  isBarcodeMiss: vi.fn().mockResolvedValue(false),
  setNameMiss: vi.fn().mockResolvedValue(undefined),
  setBarcodeMiss: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../core/storage.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../core/storage.js')>()),
  isOpenFoodFactsNameMissCached: offMocks.isNameMiss,
  isOpenFoodFactsBarcodeMissCached: offMocks.isBarcodeMiss,
  setOpenFoodFactsNameMiss: offMocks.setNameMiss,
  setOpenFoodFactsBarcodeMiss: offMocks.setBarcodeMiss,
}));

async function loadOff() {
  return import('./openFoodFacts.js');
}

function mockJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('lookupByName', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    offMocks.isNameMiss.mockReset();
    offMocks.isNameMiss.mockResolvedValue(false);
    offMocks.isBarcodeMiss.mockReset();
    offMocks.isBarcodeMiss.mockResolvedValue(false);
    offMocks.setNameMiss.mockReset();
    offMocks.setNameMiss.mockResolvedValue(undefined);
    offMocks.setBarcodeMiss.mockReset();
    offMocks.setBarcodeMiss.mockResolvedValue(undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    void loadOff().then((m) => m.resetOpenFoodFactsRateLimitForTests());
    vi.useRealTimers();
  });

  it('returns OffProduct on search hit', async () => {
    const { lookupByName } = await loadOff();
    globalThis.fetch = vi.fn(async () =>
      mockJsonResponse({
        products: [
          {
            code: '123',
            product_name: 'Test Cereal',
            brands: 'Acme',
            ingredients_text_en: 'Oats, sugar, milk.',
            allergens_tags: ['en:milk'],
            traces_tags: [],
          },
        ],
      }),
    );

    const p = await lookupByName('Test Cereal');
    expect(p).toMatchObject({
      id: '123',
      name: 'Test Cereal',
      brand: 'Acme',
      ingredientsText: 'Oats, sugar, milk.',
    });
    expect(offMocks.setNameMiss).not.toHaveBeenCalled();
  });

  it('falls back to ingredients_text when _en missing', async () => {
    const { lookupByName } = await loadOff();
    globalThis.fetch = vi.fn(async () =>
      mockJsonResponse({
        products: [
          {
            code: 'x',
            product_name: 'Y',
            ingredients_text: 'Water, soy.',
          },
        ],
      }),
    );

    const p = await lookupByName('Y');
    expect(p?.ingredientsText).toContain('soy');
  });

  it('miss records 24h negative cache key', async () => {
    const { lookupByName } = await loadOff();
    globalThis.fetch = vi.fn(async () => mockJsonResponse({ products: [] }));

    expect(await lookupByName('nope')).toBeNull();
    expect(offMocks.setNameMiss).toHaveBeenCalledWith('nope');
  });

  it('short-circuits when name miss cached', async () => {
    const { lookupByName } = await loadOff();
    offMocks.isNameMiss.mockResolvedValue(true);
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    expect(await lookupByName('cached-miss')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null on non-ok response without caching miss', async () => {
    const { lookupByName } = await loadOff();
    globalThis.fetch = vi.fn(async () => mockJsonResponse({}, false));
    expect(await lookupByName('x')).toBeNull();
    expect(offMocks.setNameMiss).not.toHaveBeenCalled();
  });

  it('returns null on timeout without caching miss', async () => {
    const { lookupByName } = await loadOff();
    vi.useFakeTimers();
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const s = init?.signal;
        if (!s) {
          return;
        }
        if (s.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        s.addEventListener('abort', onAbort);
      });
    });
    const p = lookupByName('slow');
    await vi.advanceTimersByTimeAsync(5100);
    await expect(p).resolves.toBeNull();
    expect(offMocks.setNameMiss).not.toHaveBeenCalled();
  });

  it('rate limit queues beyond 10 req/min window', async () => {
    const { lookupByName } = await loadOff();
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(async () => mockJsonResponse({ products: [] }));

    for (let i = 0; i < 10; i++) {
      await lookupByName(`rate-${i}`);
    }
    expect(globalThis.fetch).toHaveBeenCalledTimes(10);

    const p11 = lookupByName('rate-b');
    await vi.advanceTimersByTimeAsync(61_000);
    await p11;
    expect(globalThis.fetch).toHaveBeenCalledTimes(11);
  });

  it('returns null for blank name', async () => {
    const { lookupByName } = await loadOff();
    globalThis.fetch = vi.fn();
    expect(await lookupByName('   ')).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('lookupByBarcode', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    offMocks.isNameMiss.mockReset();
    offMocks.isNameMiss.mockResolvedValue(false);
    offMocks.isBarcodeMiss.mockReset();
    offMocks.isBarcodeMiss.mockResolvedValue(false);
    offMocks.setNameMiss.mockReset();
    offMocks.setNameMiss.mockResolvedValue(undefined);
    offMocks.setBarcodeMiss.mockReset();
    offMocks.setBarcodeMiss.mockResolvedValue(undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    void loadOff().then((m) => m.resetOpenFoodFactsRateLimitForTests());
  });

  it('returns product from v0 payload when v2 empty', async () => {
    const { lookupByBarcode } = await loadOff();
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const u = String(input);
      if (u.includes('/api/v2/product/')) {
        return mockJsonResponse({}, false);
      }
      if (u.includes('/api/v0/product/')) {
        return mockJsonResponse({
          product: {
            code: '999',
            product_name: 'Bar',
            ingredients_text_en: 'Sugar.',
          },
        });
      }
      return mockJsonResponse({}, false);
    });

    const p = await lookupByBarcode('999');
    expect(p?.ingredientsText).toContain('Sugar');
    expect(offMocks.setBarcodeMiss).not.toHaveBeenCalled();
  });

  it('caches barcode miss', async () => {
    const { lookupByBarcode } = await loadOff();
    globalThis.fetch = vi.fn(async () => mockJsonResponse({}, false));
    expect(await lookupByBarcode('404')).toBeNull();
    expect(offMocks.setBarcodeMiss).toHaveBeenCalledWith('404');
  });

  it('skips fetch when barcode negative cached', async () => {
    const { lookupByBarcode } = await loadOff();
    offMocks.isBarcodeMiss.mockResolvedValue(true);
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    expect(await lookupByBarcode('cached')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
