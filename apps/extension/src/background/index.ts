import { detectAllergens } from '@safesnack/allergen-engine';
import type { CachedIngredient, DetectionResult } from '@safesnack/shared-types';
import {
  onMessage,
  type LookupRequest,
  type LookupResponse,
  type Message,
} from '../core/messaging.js';
import { getCached, getSettings, setCached } from '../core/storage.js';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
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

  const text = req.ingredientsFromDom?.trim();
  if (text) {
    const result = detectAllergens({
      ingredientsText: text,
      source: 'amazon_dom',
      targetAllergens: targets,
      customAvoid,
    });
    const entry: CachedIngredient = {
      productKey: req.productKey,
      ingredientsText: result.ingredientsText ?? text,
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

  return {
    type: 'LOOKUP_RESULT',
    productKey: req.productKey,
    result: null,
    error: 'not_found',
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
  return await pending;
}

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
