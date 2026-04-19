import type { AllergenKey, DetectionResult, DetectionSource } from '@safesnack/shared-types';
import { ALL_ALLERGENS } from '@safesnack/shared-types';

import { normalizeIngredientText, splitMainAndMayZone, tokenizeIngredients } from './normalizer.js';
import { ALIAS_TO_ALLERGEN, AMBIGUOUS_TO_ALLERGEN, normalizeAlias } from './synonyms.js';

export type DetectInput = {
  ingredientsText: string | null | undefined;
  source: DetectionSource;
  targetAllergens: AllergenKey[];
  customAvoid?: string[];
};

const ALLERGEN_ORDER = new Map<AllergenKey, number>(ALL_ALLERGENS.map((k, i) => [k, i]));

const SORTED_ALIASES: [string, AllergenKey][] = [...ALIAS_TO_ALLERGEN.entries()].sort(
  (a, b) => b[0].length - a[0].length,
);
const SORTED_AMBIGUOUS: [string, AllergenKey][] = [...AMBIGUOUS_TO_ALLERGEN.entries()].sort(
  (a, b) => b[0].length - a[0].length,
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWordBoundaryMatch(haystack: string, needle: string): boolean {
  const re = new RegExp(`\\b${escapeRegex(needle)}\\b`, 'i');
  return re.test(haystack);
}

function primaryAllergensForToken(token: string): Set<AllergenKey> {
  const found = new Set<AllergenKey>();
  for (const [alias, allergen] of SORTED_ALIASES) {
    if (hasWordBoundaryMatch(token, alias)) {
      found.add(allergen);
    }
  }
  return found;
}

function ambiguousAllergensForToken(token: string): Map<string, AllergenKey> {
  const found = new Map<string, AllergenKey>();
  for (const [alias, allergen] of SORTED_AMBIGUOUS) {
    if (hasWordBoundaryMatch(token, alias)) {
      found.set(alias, allergen);
    }
  }
  return found;
}

function expandAmbiguousAlias(aliasKey: string, mapped: AllergenKey): AllergenKey[] {
  if (aliasKey === 'lecithin' || aliasKey === 'e322') {
    return ['egg', 'soy'];
  }
  return [mapped];
}

function sortAllergens(keys: Iterable<AllergenKey>): AllergenKey[] {
  return [...new Set(keys)].sort((a, b) => ALLERGEN_ORDER.get(a)! - ALLERGEN_ORDER.get(b)!);
}

function intersectTarget(set: Set<AllergenKey>, targets: readonly AllergenKey[]): AllergenKey[] {
  const t = new Set(targets);
  return sortAllergens([...set].filter((a) => t.has(a)));
}

function inTargets(a: AllergenKey, targets: readonly AllergenKey[]): boolean {
  return targets.includes(a);
}

function collectCustomAvoid(
  mainFullText: string,
  customAvoid: string[] | undefined,
  targets: readonly AllergenKey[],
): Set<AllergenKey> {
  const out = new Set<AllergenKey>();
  if (!customAvoid?.length) return out;
  const lower = mainFullText;
  for (const term of customAvoid) {
    const raw = normalizeIngredientText(term);
    if (!raw) continue;
    if (!hasWordBoundaryMatch(lower, raw)) continue;
    const key = normalizeAlias(raw);
    const ag = ALIAS_TO_ALLERGEN.get(key);
    if (ag && targets.includes(ag)) {
      out.add(ag);
    }
  }
  return out;
}

export function detectAllergens(input: DetectInput): DetectionResult {
  const { ingredientsText, source, targetAllergens, customAvoid } = input;

  if (ingredientsText == null || String(ingredientsText).trim() === '') {
    return {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 0,
      source,
    };
  }

  const { normalized, main, maySuffix } = splitMainAndMayZone(ingredientsText);
  if (!normalized) {
    return {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 0,
      source,
    };
  }

  const mainTokens = main ? tokenizeIngredients(main) : [];
  const mayTokens = maySuffix ? tokenizeIngredients(maySuffix) : [];
  const mainFullText = mainTokens.join(' ');

  const mainPrimary = new Set<AllergenKey>();
  const mainAmbiguous = new Set<AllergenKey>();
  const mayZone = new Set<AllergenKey>();

  let hasMainPrimaryHit = false;
  let hasMayZoneHit = false;
  let hasMainAmbiguousHit = false;

  for (const token of mainTokens) {
    const prim = primaryAllergensForToken(token);
    if (prim.size > 0) {
      for (const a of prim) {
        mainPrimary.add(a);
        if (inTargets(a, targetAllergens)) {
          hasMainPrimaryHit = true;
        }
      }
      continue;
    }

    const amb = ambiguousAllergensForToken(token);
    for (const [aliasKey, mapped] of amb) {
      for (const a of expandAmbiguousAlias(aliasKey, mapped)) {
        mainAmbiguous.add(a);
        if (inTargets(a, targetAllergens)) {
          hasMainAmbiguousHit = true;
        }
      }
    }
  }

  for (const token of mayTokens) {
    const prim = primaryAllergensForToken(token);
    for (const a of prim) {
      mayZone.add(a);
      if (inTargets(a, targetAllergens)) {
        hasMayZoneHit = true;
      }
    }
    const amb = ambiguousAllergensForToken(token);
    for (const [aliasKey, mapped] of amb) {
      for (const a of expandAmbiguousAlias(aliasKey, mapped)) {
        mayZone.add(a);
        if (inTargets(a, targetAllergens)) {
          hasMayZoneHit = true;
        }
      }
    }
  }

  const customHits = collectCustomAvoid(mainFullText, customAvoid, targetAllergens);
  for (const a of customHits) {
    mainPrimary.add(a);
    hasMainPrimaryHit = true;
  }

  const allergensOut = intersectTarget(new Set([...mainPrimary, ...customHits]), targetAllergens);

  const mayRaw = new Set<AllergenKey>([...mainAmbiguous, ...mayZone]);
  for (const a of allergensOut) {
    mayRaw.delete(a);
  }
  const mayContainOut = intersectTarget(mayRaw, targetAllergens);

  let confidence = 0;
  if (hasMainPrimaryHit) {
    confidence = 1;
  } else if (hasMayZoneHit) {
    confidence = 0.6;
  } else if (hasMainAmbiguousHit) {
    confidence = 0.4;
  }

  return {
    ingredientsFound: true,
    ingredientsText: normalized,
    allergens: allergensOut,
    mayContain: mayContainOut,
    confidence,
    source,
  };
}
