/**
 * Open Food Facts client — network isolated to services (not content / allergen-engine).
 * @see https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import {
  isOpenFoodFactsBarcodeMissCached,
  isOpenFoodFactsNameMissCached,
  setOpenFoodFactsBarcodeMiss,
  setOpenFoodFactsNameMiss,
} from '../core/storage.js';

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_USER_AGENT = 'SafeSnack/0.1 (contact: hello@safesnack.co)';
const LOOKUP_TIMEOUT_MS = 5000;
const RATE_MAX = 10;
const RATE_WINDOW_MS = 60_000;

const rateTimestamps: number[] = [];

export type OffProduct = {
  id: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  allergensTags?: string[];
  tracesTags?: string[];
};

/** Vitest-only: reset sliding rate window. */
export function resetOpenFoodFactsRateLimitForTests(): void {
  if (!import.meta.env.VITEST) {
    return;
  }
  rateTimestamps.length = 0;
}

async function acquireOffRateSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (rateTimestamps.length > 0 && now - rateTimestamps[0]! >= RATE_WINDOW_MS) {
      rateTimestamps.shift();
    }
    if (rateTimestamps.length < RATE_MAX) {
      rateTimestamps.push(now);
      return;
    }
    const oldest = rateTimestamps[0]!;
    const wait = RATE_WINDOW_MS - (now - oldest) + 5;
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, Math.min(2000, Math.max(15, wait)));
    });
  }
}

function parseFirstProduct(data: unknown): OffProduct | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const products = (data as { products?: unknown }).products;
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }
  const raw = products[0];
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const p = raw as Record<string, unknown>;
  const code = String(p.code ?? '').trim();
  const name = String(p.product_name ?? '').trim();
  const ingredientsRaw =
    (typeof p.ingredients_text_en === 'string' && p.ingredients_text_en.trim()) ||
    (typeof p.ingredients_text === 'string' && p.ingredients_text.trim()) ||
    '';
  if (!ingredientsRaw) {
    return null;
  }
  const brand = typeof p.brands === 'string' && p.brands.trim() ? p.brands.trim() : undefined;
  const allergensTags = Array.isArray(p.allergens_tags)
    ? p.allergens_tags.filter((x): x is string => typeof x === 'string')
    : undefined;
  const tracesTags = Array.isArray(p.traces_tags)
    ? p.traces_tags.filter((x): x is string => typeof x === 'string')
    : undefined;
  return {
    id: code || name || 'unknown',
    name: name || 'Unknown product',
    brand,
    ingredientsText: ingredientsRaw,
    allergensTags,
    tracesTags,
  };
}

/** v0 single-product JSON → OffProduct */
function parseV0SingleProduct(data: unknown): OffProduct | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const product = (data as { product?: unknown }).product;
  if (!product || typeof product !== 'object') {
    return null;
  }
  return parseFirstProduct({ products: [product as Record<string, unknown>] });
}

/** Try v2-style or generic object with nested `product`. */
function parseProductResponse(data: unknown): OffProduct | null {
  const fromNested = parseV0SingleProduct(data);
  if (fromNested) {
    return fromNested;
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.code === 'string' || typeof d.product_name === 'string') {
      return parseFirstProduct({ products: [d] });
    }
  }
  return null;
}

async function fetchOffJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal,
    headers: {
      'User-Agent': OFF_USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('off_http');
  }
  return await res.json();
}

/**
 * Search OFF by product name (Amazon tiles rarely expose barcodes).
 * Uses search.pl; rate-limited; 24h negative cache on definitive miss.
 */
export async function lookupByName(productName: string): Promise<OffProduct | null> {
  const q = productName.trim();
  if (!q) {
    return null;
  }
  if (await isOpenFoodFactsNameMissCached(q)) {
    return null;
  }

  await acquireOffRateSlot();

  const url = new URL(OFF_SEARCH);
  url.searchParams.set('search_terms', q.slice(0, 200));
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '1');
  url.searchParams.set(
    'fields',
    'code,product_name,brands,ingredients_text_en,ingredients_text,allergens_tags,traces_tags',
  );

  const ac = new AbortController();
  const timer = globalThis.setTimeout(() => ac.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const data = await fetchOffJson(url.toString(), ac.signal);
    const parsed = parseFirstProduct(data);
    if (!parsed) {
      await setOpenFoodFactsNameMiss(q);
    }
    return parsed;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return null;
    }
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/**
 * Barcode lookup (v2 endpoint first, then v0 fallback) — same rate limit / negative cache rules.
 */
export async function lookupByBarcode(barcode: string): Promise<OffProduct | null> {
  const code = barcode.trim();
  if (!code) {
    return null;
  }
  if (await isOpenFoodFactsBarcodeMissCached(code)) {
    return null;
  }

  await acquireOffRateSlot();

  const v2Url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}`;
  const v0Url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;

  const ac = new AbortController();
  const timer = globalThis.setTimeout(() => ac.abort(), LOOKUP_TIMEOUT_MS);
  try {
    let parsed: OffProduct | null = null;
    try {
      const dataV2 = await fetchOffJson(v2Url, ac.signal);
      parsed = parseProductResponse(dataV2);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw e;
      }
      parsed = null;
    }
    if (!parsed) {
      try {
        const dataV0 = await fetchOffJson(v0Url, ac.signal);
        parsed = parseV0SingleProduct(dataV0);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          throw e;
        }
        parsed = null;
      }
    }
    if (!parsed) {
      await setOpenFoodFactsBarcodeMiss(code);
    }
    return parsed;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return null;
    }
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
