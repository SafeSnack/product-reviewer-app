import type { AllergenKey } from '@safesnack/shared-types';
import { describe, expect, it } from 'vitest';

import { badgeStateFromDetection } from './badgeState.js';
import { detectAllergens } from './detect.js';

const SRC = 'amazon_dom' as const;

type Expectation = 'unsafe' | 'not_unsafe' | 'unknown';

type Row = {
  id: string;
  ingredients: string;
  targets: AllergenKey[];
  expect: Expectation;
};

/** Mirrors `docs/QA_MATRIX.md` engine fixtures (ingredient snippets — not live PDP HTML). */
const QA_MATRIX: Row[] = [
  // 10 known-unsafe (milk, peanut, wheat, sesame)
  {
    id: 'U-01',
    ingredients: 'Organic grade a milk, vitamin d3.',
    targets: ['milk'],
    expect: 'unsafe',
  },
  {
    id: 'U-02',
    ingredients: 'Lowfat milk, vitamin a palmitate, vitamin d3.',
    targets: ['milk'],
    expect: 'unsafe',
  },
  {
    id: 'U-03',
    ingredients: 'Skim milk, vitamin a palmitate, vitamin d3.',
    targets: ['milk'],
    expect: 'unsafe',
  },
  {
    id: 'U-04',
    ingredients: 'Roasted peanuts, sugar, salt.',
    targets: ['peanut'],
    expect: 'unsafe',
  },
  { id: 'U-05', ingredients: 'Peanut butter.', targets: ['peanut'], expect: 'unsafe' },
  {
    id: 'U-06',
    ingredients: 'Semolina, durum wheat flour, niacin.',
    targets: ['wheat'],
    expect: 'unsafe',
  },
  { id: 'U-07', ingredients: 'Whole wheat flour, water.', targets: ['wheat'], expect: 'unsafe' },
  { id: 'U-08', ingredients: 'Sesame seeds, salt.', targets: ['sesame'], expect: 'unsafe' },
  {
    id: 'U-09',
    ingredients: 'Tahini (ground sesame seeds).',
    targets: ['sesame'],
    expect: 'unsafe',
  },
  { id: 'U-10', ingredients: 'Malt extract, barley malt.', targets: ['wheat'], expect: 'unsafe' },
  // 10 known-not-unsafe (no declared allergen for profile; badge must not be Unsafe)
  { id: 'S-01', ingredients: 'Water, carbon dioxide.', targets: ['milk'], expect: 'not_unsafe' },
  {
    id: 'S-02',
    ingredients: 'Tomatoes, salt, citric acid.',
    targets: ['milk'],
    expect: 'not_unsafe',
  },
  {
    id: 'S-03',
    ingredients: 'Black beans, water, salt.',
    targets: ['peanut'],
    expect: 'not_unsafe',
  },
  { id: 'S-04', ingredients: 'Green beans, water.', targets: ['wheat'], expect: 'not_unsafe' },
  { id: 'S-05', ingredients: '100% apple juice.', targets: ['sesame'], expect: 'not_unsafe' },
  { id: 'S-06', ingredients: 'Carrots.', targets: ['milk'], expect: 'not_unsafe' },
  { id: 'S-07', ingredients: 'Rice, water.', targets: ['wheat'], expect: 'not_unsafe' },
  { id: 'S-08', ingredients: 'Olive oil.', targets: ['soy'], expect: 'not_unsafe' },
  { id: 'S-09', ingredients: 'Salt, black pepper.', targets: ['fish'], expect: 'not_unsafe' },
  { id: 'S-10', ingredients: 'Distilled vinegar, water.', targets: ['egg'], expect: 'not_unsafe' },
  // 10 ambiguous / edge
  { id: 'A-01', ingredients: 'Sugar. May contain milk.', targets: ['milk'], expect: 'unknown' },
  {
    id: 'A-02',
    ingredients: 'Sugar. May contain peanuts.',
    targets: ['peanut'],
    expect: 'unknown',
  },
  {
    id: 'A-03',
    ingredients: 'Coconut cream, pea protein. May contain tree nuts.',
    targets: ['peanut'],
    expect: 'not_unsafe',
  },
  { id: 'A-04', ingredients: 'Natural flavors.', targets: ['milk'], expect: 'not_unsafe' },
  { id: 'A-05', ingredients: 'Lecithin.', targets: ['soy'], expect: 'unknown' },
  {
    id: 'A-06',
    ingredients: 'Processed in a facility that processes wheat.',
    targets: ['wheat'],
    expect: 'unknown',
  },
  { id: 'A-07', ingredients: 'Almonds, sea salt.', targets: ['milk'], expect: 'not_unsafe' },
  {
    id: 'A-08',
    ingredients: 'Skim milk, vitamin a palmitate.',
    targets: ['sesame'],
    expect: 'not_unsafe',
  },
  {
    id: 'A-09',
    ingredients: 'Dairy-free blend (coconut oil, modified food starch).',
    targets: ['milk'],
    expect: 'not_unsafe',
  },
  {
    id: 'A-10',
    ingredients: 'Enriched flour (wheat flour, niacin).',
    targets: ['milk'],
    expect: 'not_unsafe',
  },
  // 5 non-food / no ingredient text
  { id: 'N-01', ingredients: '', targets: ['milk'], expect: 'unknown' },
  { id: 'N-02', ingredients: '   ', targets: ['peanut'], expect: 'unknown' },
  { id: 'N-03', ingredients: '', targets: ['wheat'], expect: 'unknown' },
  { id: 'N-04', ingredients: '', targets: ['sesame'], expect: 'unknown' },
  { id: 'N-05', ingredients: '', targets: ['egg'], expect: 'unknown' },
  // 5 “seasonal / brittle DOM” placeholders (treat as no parseable ingredients)
  { id: 'Q-01', ingredients: '', targets: ['milk'], expect: 'unknown' },
  { id: 'Q-02', ingredients: '', targets: ['milk'], expect: 'unknown' },
  { id: 'Q-03', ingredients: '', targets: ['wheat'], expect: 'unknown' },
  { id: 'Q-04', ingredients: '', targets: ['peanut'], expect: 'unknown' },
  { id: 'Q-05', ingredients: '', targets: ['sesame'], expect: 'unknown' },
];

function assertRow(row: Row): void {
  const d = detectAllergens({
    ingredientsText: row.ingredients,
    source: SRC,
    targetAllergens: row.targets,
  });
  const badge = badgeStateFromDetection(d);
  if (row.expect === 'unsafe') {
    expect(badge, row.id).toBe('unsafe');
  } else if (row.expect === 'not_unsafe') {
    expect(badge === 'unsafe', `${row.id} must not be false Unsafe; got ${badge}`).toBe(false);
  } else {
    expect(badge, row.id).toBe('unknown');
  }
}

describe('QA matrix (docs/QA_MATRIX.md engine fixtures)', () => {
  it('has 40 rows', () => {
    expect(QA_MATRIX.length).toBe(40);
  });

  it.each(QA_MATRIX)('$id meets expectation', (row) => {
    assertRow(row);
  });

  it('unsafe recall: every unsafe row is Unsafe badge', () => {
    const unsafeRows = QA_MATRIX.filter((r) => r.expect === 'unsafe');
    expect(unsafeRows.length).toBe(10);
    for (const row of unsafeRows) {
      assertRow(row);
    }
  });

  it('overall accuracy vs expectations (unsafe + exact + not_unsafe)', () => {
    let ok = 0;
    for (const row of QA_MATRIX) {
      const d = detectAllergens({
        ingredientsText: row.ingredients,
        source: SRC,
        targetAllergens: row.targets,
      });
      const badge = badgeStateFromDetection(d);
      let pass = false;
      if (row.expect === 'unsafe') pass = badge === 'unsafe';
      else if (row.expect === 'not_unsafe') pass = badge !== 'unsafe';
      else pass = badge === 'unknown';
      if (pass) ok++;
    }
    expect(ok / QA_MATRIX.length).toBeGreaterThanOrEqual(0.9);
  });
});
