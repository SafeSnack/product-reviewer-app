import type { AllergenKey, DetectionResult } from '@safesnack/shared-types';
import { describe, expect, it } from 'vitest';

import { detectAllergens } from './detect.js';
import { normalizeIngredientText } from './normalizer.js';

const SRC = 'amazon_dom' as const;

function N(s: string): string {
  return normalizeIngredientText(s);
}

function det(
  ingredientsText: string | null | undefined,
  targetAllergens: AllergenKey[],
  expected: DetectionResult,
): void {
  expect(
    detectAllergens({
      ingredientsText,
      source: SRC,
      targetAllergens,
    }),
  ).toEqual(expected);
}

describe('detectAllergens — Task 1.4 matrix', () => {
  it('1 sugar/salt vs milk', () => {
    det('Sugar, salt.', ['milk'], {
      ingredientsFound: true,
      ingredientsText: N('Sugar, salt.'),
      allergens: [],
      mayContain: [],
      confidence: 0,
      source: SRC,
    });
  });

  it('2 milk chocolate', () => {
    det('Milk chocolate (sugar, cocoa, milk).', ['milk'], {
      ingredientsFound: true,
      ingredientsText: N('Milk chocolate (sugar, cocoa, milk).'),
      allergens: ['milk'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('3 peanuts', () => {
    det('Peanuts, salt.', ['peanut'], {
      ingredientsFound: true,
      ingredientsText: N('Peanuts, salt.'),
      allergens: ['peanut'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('4 may contain peanuts', () => {
    det('Sugar. May contain peanuts.', ['peanut'], {
      ingredientsFound: true,
      ingredientsText: N('Sugar. May contain peanuts.'),
      allergens: [],
      mayContain: ['peanut'],
      confidence: 0.6,
      source: SRC,
    });
  });

  it('5 whey casein', () => {
    det('Whey protein, casein.', ['milk'], {
      ingredientsFound: true,
      ingredientsText: N('Whey protein, casein.'),
      allergens: ['milk'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('6 almonds cashews', () => {
    det('Almonds, cashews.', ['tree_nut', 'peanut'], {
      ingredientsFound: true,
      ingredientsText: N('Almonds, cashews.'),
      allergens: ['tree_nut'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('7 peanut butter', () => {
    det('Peanut butter.', ['peanut'], {
      ingredientsFound: true,
      ingredientsText: N('Peanut butter.'),
      allergens: ['peanut'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('8 butter not peanut', () => {
    det('Butter, salt.', ['peanut'], {
      ingredientsFound: true,
      ingredientsText: N('Butter, salt.'),
      allergens: [],
      mayContain: [],
      confidence: 0,
      source: SRC,
    });
  });

  it('9 soy lecithin', () => {
    det('Soy lecithin.', ['soy'], {
      ingredientsFound: true,
      ingredientsText: N('Soy lecithin.'),
      allergens: ['soy'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('10 lecithin ambiguous → soy mayContain', () => {
    det('Lecithin.', ['soy'], {
      ingredientsFound: true,
      ingredientsText: N('Lecithin.'),
      allergens: [],
      mayContain: ['soy'],
      confidence: 0.4,
      source: SRC,
    });
  });

  it('11 wheat and soy', () => {
    det('Contains wheat and soy.', ['wheat', 'soy'], {
      ingredientsFound: true,
      ingredientsText: N('Contains wheat and soy.'),
      allergens: ['soy', 'wheat'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('12 manufactured on equipment — tree nuts + sesame', () => {
    det(
      'Sugar. Manufactured on equipment that processes tree nuts and sesame.',
      ['tree_nut', 'sesame'],
      {
        ingredientsFound: true,
        ingredientsText: N('Sugar. Manufactured on equipment that processes tree nuts and sesame.'),
        allergens: [],
        mayContain: ['tree_nut', 'sesame'],
        confidence: 0.6,
        source: SRC,
      },
    );
  });

  it('13 semolina durum wheat', () => {
    det('Semolina, durum wheat, salt.', ['wheat'], {
      ingredientsFound: true,
      ingredientsText: N('Semolina, durum wheat, salt.'),
      allergens: ['wheat'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('14 tahini sesame oil', () => {
    det('Tahini, sesame oil.', ['sesame'], {
      ingredientsFound: true,
      ingredientsText: N('Tahini, sesame oil.'),
      allergens: ['sesame'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('15 crab shrimp', () => {
    det('Crab, shrimp.', ['shellfish'], {
      ingredientsFound: true,
      ingredientsText: N('Crab, shrimp.'),
      allergens: ['shellfish'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('16 anchovy paste', () => {
    det('Anchovy paste.', ['fish'], {
      ingredientsFound: true,
      ingredientsText: N('Anchovy paste.'),
      allergens: ['fish'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('17 empty string', () => {
    det('', ['milk'], {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 0,
      source: SRC,
    });
  });

  it('18 null', () => {
    det(null, ['milk'], {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 0,
      source: SRC,
    });
  });

  it('19 dijon mustard', () => {
    det('Ingredients: sugar; salt; dijon mustard.', ['mustard'], {
      ingredientsFound: true,
      ingredientsText: N('Ingredients: sugar; salt; dijon mustard.'),
      allergens: ['mustard'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('20 worcestershire sauce', () => {
    det('Worcestershire sauce.', ['fish'], {
      ingredientsFound: true,
      ingredientsText: N('Worcestershire sauce.'),
      allergens: ['fish'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('customAvoid: standalone term maps via alias table', () => {
    expect(
      detectAllergens({
        ingredientsText: 'Water, lactose.',
        source: SRC,
        targetAllergens: ['milk'],
        customAvoid: ['lactose'],
      }),
    ).toEqual({
      ingredientsFound: true,
      ingredientsText: N('Water, lactose.'),
      allergens: ['milk'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    });
  });

  it('may-zone ambiguous lecithin (may-contain clause)', () => {
    expect(
      detectAllergens({
        ingredientsText: 'Sugar. May contain lecithin.',
        source: SRC,
        targetAllergens: ['egg'],
      }),
    ).toEqual({
      ingredientsFound: true,
      ingredientsText: N('Sugar. May contain lecithin.'),
      allergens: [],
      mayContain: ['egg'],
      confidence: 0.6,
      source: SRC,
    });
  });

  it('e322 ambiguous expands like lecithin', () => {
    expect(
      detectAllergens({
        ingredientsText: 'E322.',
        source: SRC,
        targetAllergens: ['soy'],
      }),
    ).toEqual({
      ingredientsFound: true,
      ingredientsText: N('E322.'),
      allergens: [],
      mayContain: ['soy'],
      confidence: 0.4,
      source: SRC,
    });
  });
});
