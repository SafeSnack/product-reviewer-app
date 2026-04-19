import { beforeEach, describe, expect, it } from 'vitest';
import {
  AMAZON_SELECTORS,
  extractAsin,
  extractIngredientsFromPdp,
  findPdpIngredientsMountPoint,
  firstMatch,
} from './amazon.js';

describe('amazon selectors', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('firstMatch returns first hit in selector order', () => {
    document.body.innerHTML = `
      <div class="a">no</div>
      <div class="b"><span class="hit">yes</span></div>
    `;
    const el = firstMatch(document.body, ['.missing', '.b span.hit', '.a']);
    expect(el?.textContent?.trim()).toBe('yes');
  });

  it('firstMatch returns null when nothing matches', () => {
    document.body.innerHTML = '<div class="a"></div>';
    expect(firstMatch(document.body, ['.missing', '.also-missing'])).toBeNull();
  });

  it('firstMatch ignores invalid selectors', () => {
    document.body.innerHTML = '<div id="x"></div>';
    expect(firstMatch(document.body, [':not-a-real-selector', '#x'])).toBeTruthy();
  });

  it('extractAsin reads data-asin on tile or ancestor', () => {
    document.body.innerHTML = `
      <div data-asin="B0ABCDEFGH" data-component-type="s-search-result">
        <div class="inner"><span class="t">Cereal</span></div>
      </div>
    `;
    const inner = document.querySelector('.inner')!;
    expect(extractAsin(inner)).toBe('B0ABCDEFGH');
    const outer = document.querySelector('[data-component-type]')!;
    expect(extractAsin(outer)).toBe('B0ABCDEFGH');
  });

  it('extractAsin returns null for invalid ASIN', () => {
    document.body.innerHTML = `<div data-asin="bad" id="t"></div>`;
    const el = document.getElementById('t')!;
    expect(extractAsin(el)).toBeNull();
  });

  it('extractIngredientsFromPdp reads nic-ingredients block', () => {
    document.body.innerHTML = `
      <div id="nic-ingredients_feature_div">
        <p>Oats, honey, salt.</p>
      </div>
    `;
    expect(extractIngredientsFromPdp()).toContain('Oats');
  });

  it('extractIngredientsFromPdp uses heading fallback', () => {
    document.body.innerHTML = `
      <div class="a-section">
        <h4>Ingredients</h4>
        <p>Sugar, cocoa.</p>
      </div>
    `;
    expect(extractIngredientsFromPdp()).toContain('Sugar');
  });

  it('extractIngredientsFromPdp returns null when nothing matches', () => {
    document.body.innerHTML = '<div id="root">no ingredients here</div>';
    expect(extractIngredientsFromPdp(document.getElementById('root')!)).toBeNull();
  });

  it('findPdpIngredientsMountPoint matches nic-ingredients block', () => {
    document.body.innerHTML = `
      <div id="nic-ingredients_feature_div">
        <p>Oats, honey, salt.</p>
      </div>
    `;
    const el = findPdpIngredientsMountPoint();
    expect(el?.id).toBe('nic-ingredients_feature_div');
  });

  it('findPdpIngredientsMountPoint matches heading fallback body', () => {
    document.body.innerHTML = `
      <div class="a-section">
        <h4>Ingredients</h4>
        <p>Sugar, cocoa.</p>
      </div>
    `;
    const el = findPdpIngredientsMountPoint();
    expect(el?.textContent).toContain('Sugar');
  });

  it('AMAZON_SELECTORS exposes expected groups', () => {
    expect(AMAZON_SELECTORS.tileAsinAttr).toBe('data-asin');
    expect(AMAZON_SELECTORS.tile.length).toBeGreaterThan(0);
    expect(AMAZON_SELECTORS.pdpIngredientsBlocks.length).toBeGreaterThan(0);
  });
});
