/** Canonical cross-package types (see SAFESNACK_PRD.md §11). */

export type AllergenKey =
  | 'milk'
  | 'egg'
  | 'peanut'
  | 'tree_nut'
  | 'soy'
  | 'wheat'
  | 'fish'
  | 'shellfish'
  | 'sesame'
  | 'mustard';

export const ALL_ALLERGENS: readonly AllergenKey[] = [
  'milk',
  'egg',
  'peanut',
  'tree_nut',
  'soy',
  'wheat',
  'fish',
  'shellfish',
  'sesame',
  'mustard',
] as const;

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  milk: 'Milk',
  egg: 'Egg',
  peanut: 'Peanut',
  tree_nut: 'Tree Nuts',
  soy: 'Soy',
  wheat: 'Wheat / Gluten',
  fish: 'Fish',
  shellfish: 'Shellfish',
  sesame: 'Sesame',
  mustard: 'Mustard',
};

export type DetectionSource = 'amazon_dom' | 'off_api' | 'usda' | 'llm' | 'user_submission';

export type DetectionResult = {
  ingredientsFound: boolean;
  ingredientsText: string | null;
  allergens: AllergenKey[];
  mayContain: AllergenKey[];
  confidence: number; // 0..1
  source: DetectionSource;
};

export type BadgeState = 'safe' | 'unsafe' | 'unknown';

export type LocalSettings = {
  version: 1;
  allergens: AllergenKey[];
  customAvoid: string[];
  uiPreferences: {
    showBadgesOn: ('search' | 'pdp' | 'cart')[];
    badgeStyle: 'minimal' | 'verbose';
  };
  installedAt: string;
  onboardingCompleted: boolean;
};

export type CachedIngredient = {
  productKey: string;
  ingredientsText: string;
  detectedAllergens: AllergenKey[];
  mayContain: AllergenKey[];
  source: DetectionSource;
  fetchedAt: number;
  ttl: number;
};

export const DEFAULT_SETTINGS = (): LocalSettings => ({
  version: 1,
  allergens: [],
  customAvoid: [],
  uiPreferences: {
    showBadgesOn: ['search', 'pdp'],
    badgeStyle: 'minimal',
  },
  installedAt: new Date().toISOString(),
  onboardingCompleted: false,
});
