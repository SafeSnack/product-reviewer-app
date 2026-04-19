import type { AllergenKey } from '@safesnack/shared-types';

/**
 * Normalize surface forms for dictionary lookup: lowercase, trim, punctuation → space, collapse spaces.
 * Sources consulted for lists: FDA Food Allergen Labeling (FALCPA / FASTER), FARE, Celiac Disease Foundation.
 */
export function normalizeAlias(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\u2013\u2014]/g, '-') // en/em dash → hyphen then hyphen → space below
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SynonymEntry = {
  allergen: AllergenKey;
  /** Normalized tokens / phrases (lowercase, no punctuation). */
  aliases: string[];
  /** Terms that may indicate this allergen; treat with lower confidence upstream. */
  ambiguous?: string[];
};

/**
 * Canonical synonym rows. Aliases are globally unique across `aliases` (not `ambiguous`).
 * Note: "nougat" appears in FDA-style milk lists and nut confections; mapped once to `tree_nut` here.
 */
export const SYNONYMS: readonly SynonymEntry[] = [
  {
    allergen: 'milk',
    aliases: [
      'milk',
      'whey',
      'casein',
      'caseinate',
      'caseinates',
      'lactose',
      'lactalbumin',
      'lactoglobulin',
      'ghee',
      'butter',
      'buttermilk',
      'cream',
      'half and half',
      'cheese',
      'yogurt',
      'curd',
      'kefir',
      'custard',
      'pudding',
      'ice cream',
      'milk solids',
      'milk fat',
      'milk powder',
      'skim milk',
      'condensed milk',
      'evaporated milk',
      'recaldent',
      'rennet casein',
    ],
  },
  {
    allergen: 'egg',
    aliases: [
      'egg',
      'eggs',
      'albumin',
      'albumen',
      'globulin',
      'lysozyme',
      'livetin',
      'ovalbumin',
      'ovoglobulin',
      'ovomucin',
      'ovomucoid',
      'ovotransferrin',
      'ovovitellin',
      'silici albuminate',
      'simplesse',
      'vitellin',
      'mayonnaise',
      'meringue',
      'surimi',
    ],
    ambiguous: ['lecithin', 'e322'],
  },
  {
    allergen: 'peanut',
    aliases: [
      'peanut',
      'peanuts',
      'groundnut',
      'monkey nut',
      'arachis oil',
      'arachis hypogaea',
      'mandelona',
      'beer nuts',
      'goober',
      'peanut flour',
      'peanut butter',
    ],
  },
  {
    allergen: 'tree_nut',
    aliases: [
      'almond',
      'almonds',
      'almond paste',
      'brazil nut',
      'brazil nuts',
      'cashew',
      'cashews',
      'chestnut',
      'chestnuts',
      'hazelnut',
      'hazelnuts',
      'filbert',
      'filberts',
      'macadamia',
      'macadamia nuts',
      'pecan',
      'pecans',
      'pine nut',
      'pine nuts',
      'pinon',
      'pistachio',
      'pistachios',
      'walnut',
      'walnuts',
      'marzipan',
      'nougat',
      'nut butter',
      'nut oil',
      'nut paste',
      'gianduja',
      'praline',
    ],
  },
  {
    allergen: 'soy',
    aliases: [
      'soy',
      'soya',
      'soybean',
      'soybeans',
      'edamame',
      'tofu',
      'tempeh',
      'miso',
      'natto',
      'shoyu',
      'tamari',
      'textured vegetable protein',
      'tvp',
      'soy protein',
      'soy lecithin',
      'soy flour',
      'soy sauce',
      'soybean oil',
    ],
  },
  {
    allergen: 'wheat',
    aliases: [
      'wheat',
      'gluten',
      'semolina',
      'durum',
      'farina',
      'spelt',
      'kamut',
      'einkorn',
      'emmer',
      'triticale',
      'bulgur',
      'couscous',
      'seitan',
      'atta',
      'matzo',
      'graham flour',
      'wheat starch',
      'hydrolyzed wheat protein',
      'malt',
      'malt extract',
      'wheat germ',
      'wheat bran',
    ],
  },
  {
    allergen: 'fish',
    aliases: [
      'fish',
      'anchovy',
      'anchovies',
      'bass',
      'catfish',
      'cod',
      'flounder',
      'haddock',
      'hake',
      'halibut',
      'herring',
      'mahi mahi',
      'perch',
      'pike',
      'pollock',
      'salmon',
      'sardine',
      'sardines',
      'snapper',
      'sole',
      'swordfish',
      'tilapia',
      'trout',
      'tuna',
      'caviar',
      'roe',
      'fish sauce',
      'worcestershire',
    ],
  },
  {
    allergen: 'shellfish',
    aliases: [
      'shellfish',
      'crustacean',
      'crab',
      'crayfish',
      'crawfish',
      'lobster',
      'prawn',
      'prawns',
      'shrimp',
      'krill',
      'langoustine',
      'scampi',
      'mollusk',
      'clam',
      'clams',
      'cockle',
      'mussel',
      'mussels',
      'octopus',
      'oyster',
      'oysters',
      'scallop',
      'scallops',
      'squid',
      'calamari',
      'abalone',
      'snail',
      'escargot',
    ],
  },
  {
    allergen: 'sesame',
    aliases: [
      'sesame',
      'sesame seed',
      'sesame seeds',
      'sesame oil',
      'tahini',
      'benne',
      'sim sim',
      'til',
      'gingelly',
      'halva',
      'halvah',
    ],
  },
  {
    allergen: 'mustard',
    aliases: [
      'mustard',
      'mustard seed',
      'mustard seeds',
      'mustard flour',
      'mustard oil',
      'dijon',
      'whole grain mustard',
    ],
  },
];

export const MAY_CONTAIN_PHRASES: readonly string[] = [
  'may contain',
  'may contains',
  'made in a facility',
  'shared equipment',
  'processed in a facility',
  'manufactured on equipment',
  'produced in a facility',
  'may also contain',
].map((p) => normalizeAlias(p));

function buildAliasMaps(entries: readonly SynonymEntry[]): {
  aliasToAllergen: Map<string, AllergenKey>;
  ambiguousToAllergen: Map<string, AllergenKey>;
} {
  const aliasToAllergen = new Map<string, AllergenKey>();
  const ambiguousToAllergen = new Map<string, AllergenKey>();

  for (const row of entries) {
    for (const raw of row.aliases) {
      const key = normalizeAlias(raw);
      if (!key) continue;
      if (aliasToAllergen.has(key)) {
        throw new Error(`Duplicate allergen alias key "${key}"`);
      }
      if (ambiguousToAllergen.has(key)) {
        throw new Error(`Alias "${key}" already registered as ambiguous`);
      }
      aliasToAllergen.set(key, row.allergen);
    }
    for (const raw of row.ambiguous ?? []) {
      const key = normalizeAlias(raw);
      if (!key) continue;
      if (aliasToAllergen.has(key)) {
        throw new Error(`Ambiguous term "${key}" collides with a primary alias`);
      }
      if (ambiguousToAllergen.has(key)) {
        throw new Error(`Duplicate ambiguous key "${key}"`);
      }
      ambiguousToAllergen.set(key, row.allergen);
    }
  }

  return { aliasToAllergen, ambiguousToAllergen };
}

const { aliasToAllergen, ambiguousToAllergen } = buildAliasMaps(SYNONYMS);

export const ALIAS_TO_ALLERGEN: ReadonlyMap<string, AllergenKey> = aliasToAllergen;
export const AMBIGUOUS_TO_ALLERGEN: ReadonlyMap<string, AllergenKey> = ambiguousToAllergen;
