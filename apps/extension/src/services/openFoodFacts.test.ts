import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupByName, lookupProductByBarcode } from './openFoodFacts.js';

function mockJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('lookupByName', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns OffProduct on search hit', async () => {
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
  });

  it('falls back to ingredients_text when _en missing', async () => {
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

  it('returns null on empty products', async () => {
    globalThis.fetch = vi.fn(async () => mockJsonResponse({ products: [] }));

    expect(await lookupByName('nope')).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    globalThis.fetch = vi.fn(async () => mockJsonResponse({}, false));
    expect(await lookupByName('x')).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new DOMException('Aborted', 'AbortError');
    });
    expect(await lookupByName('slow')).toBeNull();
  });

  it('returns null for blank name', async () => {
    globalThis.fetch = vi.fn();
    expect(await lookupByName('   ')).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('lookupProductByBarcode', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null when product missing', async () => {
    globalThis.fetch = vi.fn(async () => mockJsonResponse({ status: 0 }));
    expect(await lookupProductByBarcode('999')).toBeNull();
  });
});
