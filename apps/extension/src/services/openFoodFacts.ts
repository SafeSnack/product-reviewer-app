/**
 * Open Food Facts client — network isolated to services (not content / allergen-engine).
 * @see SAFESNACK_IMPLEMENTATION_PLAN.md Task 4.1
 */

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_USER_AGENT = 'SafeSnack/0.1 (contact: hello@safesnack.co)';
const LOOKUP_TIMEOUT_MS = 5000;

export type OffProduct = {
  id: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  allergensTags?: string[];
  tracesTags?: string[];
};

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

/**
 * Search OFF by product name (Amazon tiles rarely expose barcodes).
 */
export async function lookupByName(productName: string): Promise<OffProduct | null> {
  const q = productName.trim();
  if (!q) {
    return null;
  }
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
    const res = await fetch(url.toString(), {
      signal: ac.signal,
      headers: {
        'User-Agent': OFF_USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return null;
    }
    const data: unknown = await res.json();
    return parseFirstProduct(data);
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/**
 * Barcode PDP / future flows (stub until wired to UI).
 */
export async function lookupProductByBarcode(barcode: string): Promise<OffProduct | null> {
  const code = barcode.trim();
  if (!code) {
    return null;
  }
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
  const ac = new AbortController();
  const timer = globalThis.setTimeout(() => ac.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        'User-Agent': OFF_USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { product?: Record<string, unknown> };
    const p = data.product;
    if (!p || typeof p !== 'object') {
      return null;
    }
    return parseFirstProduct({ products: [p] });
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
