import { describe, expect, it } from 'vitest';

import { normalizeIngredientText, tokenizeIngredients } from './normalizer.js';

describe('normalizeIngredientText', () => {
  it('returns empty for empty input', () => {
    expect(normalizeIngredientText('')).toBe('');
  });

  it('lowercases and collapses whitespace', () => {
    expect(normalizeIngredientText('  Sugar   WATER  ')).toBe('sugar water');
  });

  it('replaces curly quotes with straight quotes', () => {
    expect(normalizeIngredientText('\u2018milk\u2019')).toBe("'milk'");
    expect(normalizeIngredientText('\u201ccream\u201d')).toBe('"cream"');
  });

  it('strips HTML tags', () => {
    expect(normalizeIngredientText('<p>Milk</p> and <b>soy</b>')).toBe('milk and soy');
    expect(normalizeIngredientText('<span class="x">Eggs</span>')).toBe('eggs');
  });

  it('strips markdown emphasis', () => {
    expect(normalizeIngredientText('**milk** solids')).toBe('milk solids');
    expect(normalizeIngredientText('*vanilla* extract')).toBe('vanilla extract');
    expect(normalizeIngredientText('__whey__ powder')).toBe('whey powder');
  });

  it('preserves parentheses', () => {
    expect(normalizeIngredientText('Chocolate (Milk, Soy)')).toBe('chocolate (milk, soy)');
  });

  it('preserves may contain phrasing as plain text', () => {
    const s = 'Peanuts. May contain traces of tree nuts.';
    expect(normalizeIngredientText(s)).toBe('peanuts. may contain traces of tree nuts.');
  });

  it('handles mixed punctuation and markdown', () => {
    expect(normalizeIngredientText('  <em>*Milk*</em>  ,  water  ')).toBe('milk , water');
  });
});

describe('tokenizeIngredients', () => {
  it('returns empty array for empty string', () => {
    expect(tokenizeIngredients('')).toEqual([]);
  });

  it('tokenizes single ingredient', () => {
    expect(tokenizeIngredients('Milk')).toEqual(['milk']);
  });

  it('expands parenthetical sub-ingredients', () => {
    expect(tokenizeIngredients('chocolate (milk, soy lecithin)')).toEqual([
      'chocolate',
      'milk',
      'soy lecithin',
    ]);
  });

  it('splits top-level commas but not commas inside parens', () => {
    expect(tokenizeIngredients('a, b (x, y), c')).toEqual(['a', 'b', 'x', 'y', 'c']);
  });

  it('splits on semicolon, and, ampersand', () => {
    expect(tokenizeIngredients('a; b')).toEqual(['a', 'b']);
    expect(tokenizeIngredients('a and b')).toEqual(['a', 'b']);
    expect(tokenizeIngredients('a & b')).toEqual(['a', 'b']);
  });

  it('keeps unbalanced parenthesis as single phrase', () => {
    expect(tokenizeIngredients('milk (casein')).toEqual(['milk (casein']);
  });

  it('strips leading bullets and numbers', () => {
    expect(tokenizeIngredients('• 1. Milk')).toEqual(['milk']);
    expect(tokenizeIngredients('* 2) Soy')).toEqual(['soy']);
  });

  it('handles HTML-heavy label', () => {
    const toks = tokenizeIngredients('<div>Sugar</div>, <b>Milk</b>');
    expect(toks).toContain('sugar');
    expect(toks).toContain('milk');
  });

  it('retains may contain clause as final token (PRD-style label)', () => {
    const sample =
      'Ingredients: Sugar, Milk Chocolate (sugar, cocoa butter, milk, soy lecithin, vanilla), Peanuts. May contain traces of tree nuts.';
    const toks = tokenizeIngredients(sample);
    expect(toks).toContain('milk');
    expect(toks).toContain('soy lecithin');
    expect(toks).toContain('peanuts');
    expect(toks.some((t) => t.startsWith('may contain'))).toBe(true);
    expect(toks.some((t) => t.includes('tree nuts'))).toBe(true);
  });
});
