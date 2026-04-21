import { detectAllergens } from '@safesnack/allergen-engine';
import type { CachedIngredient } from '@safesnack/shared-types';
import { getSettings, setCached } from './storage.js';

const SUBMISSIONS_KEY = 'submissions' as const;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Submission = {
  productKey: string;
  productName: string;
  ingredientsText: string;
  submittedAt: number;
  status: 'queued' | 'synced';
};

function hasChromeLocal(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function isSubmissionRow(v: unknown): v is Submission {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const r = v as Record<string, unknown>;
  return (
    typeof r.productKey === 'string' &&
    typeof r.productName === 'string' &&
    typeof r.ingredientsText === 'string' &&
    typeof r.submittedAt === 'number' &&
    (r.status === 'queued' || r.status === 'synced')
  );
}

async function readSubmissions(): Promise<Submission[]> {
  if (!hasChromeLocal()) {
    return [];
  }
  try {
    const raw = await chrome.storage.local.get(SUBMISSIONS_KEY);
    const list = raw[SUBMISSIONS_KEY];
    if (!Array.isArray(list)) {
      return [];
    }
    return list.filter(isSubmissionRow);
  } catch {
    return [];
  }
}

async function writeSubmissions(rows: Submission[]): Promise<void> {
  if (!hasChromeLocal()) {
    return;
  }
  try {
    await chrome.storage.local.set({ [SUBMISSIONS_KEY]: rows });
  } catch {
    // ignore
  }
}

/**
 * Persist a user ingredient submission and refresh local ingredient cache for this product.
 * Sync to server is deferred to v2.
 */
export async function queueSubmission(
  s: Omit<Submission, 'status' | 'submittedAt'>,
): Promise<void> {
  const text = s.ingredientsText.trim();
  if (!s.productKey.trim() || !text) {
    return;
  }

  const settings = await getSettings();
  const result = detectAllergens({
    ingredientsText: text,
    source: 'user_submission',
    targetAllergens: settings.allergens,
    customAvoid: settings.customAvoid,
  });

  const entry: CachedIngredient = {
    productKey: s.productKey.trim(),
    ingredientsText: result.ingredientsText ?? text,
    detectedAllergens: result.allergens,
    mayContain: result.mayContain,
    source: 'user_submission',
    fetchedAt: Date.now(),
    ttl: CACHE_TTL_MS,
  };
  await setCached(entry);

  const row: Submission = {
    productKey: s.productKey.trim(),
    productName: s.productName.trim(),
    ingredientsText: text,
    submittedAt: Date.now(),
    status: 'queued',
  };
  const list = await readSubmissions();
  list.push(row);
  await writeSubmissions(list);
}

export async function getQueuedSubmissions(): Promise<Submission[]> {
  return readSubmissions();
}

/** Distinct product keys the user has contributed ingredient text for (MVP popup count). */
export async function getHelpedProductCount(): Promise<number> {
  const rows = await readSubmissions();
  return new Set(rows.map((r) => r.productKey)).size;
}
