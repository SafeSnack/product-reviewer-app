import { describe, expect, it } from 'vitest';
import type { DetectionResult } from '@safesnack/shared-types';
import {
  buildHighlightSpecs,
  buildPdpBannerLines,
  escapeRegex,
  findBestWordBoundaryMatch,
  mountPdpUi,
} from './highlighter.js';

describe('escapeRegex', () => {
  it('escapes metacharacters', () => {
    expect(escapeRegex('a+b')).toBe('a\\+b');
    expect(escapeRegex('(milk)')).toBe('\\(milk\\)');
  });
});

describe('buildHighlightSpecs', () => {
  it('includes synonym phrases for requested allergens', () => {
    const specs = buildHighlightSpecs(['milk']);
    const phrases = specs.map((s) => s.phrase.toLowerCase());
    expect(phrases).toContain('milk');
    expect(phrases).toContain('whey');
    expect(specs.every((s) => s.allergen === 'milk')).toBe(true);
  });
});

describe('buildPdpBannerLines', () => {
  it('uses emoji prefixes for contains / may contain / verify', () => {
    const r: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'x',
      allergens: ['milk', 'soy'],
      mayContain: ['peanut'],
      confidence: 0.9,
      source: 'amazon_dom',
    };
    const lines = buildPdpBannerLines(r);
    expect(lines.some((l) => l.startsWith('🔴') && l.includes('Milk') && l.includes('Soy'))).toBe(
      true,
    );
    expect(lines.some((l) => l.startsWith('🟡') && l.includes('Peanut'))).toBe(true);
    expect(lines.some((l) => l.startsWith('✅') && l.includes('Always verify packaging'))).toBe(
      true,
    );
  });

  it('does not claim all-clear when only may-contain matches profile', () => {
    const r: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'sugar. may contain peanuts.',
      allergens: [],
      mayContain: ['peanut'],
      confidence: 0.6,
      source: 'amazon_dom',
    };
    const lines = buildPdpBannerLines(r);
    expect(lines.some((l) => l.includes('No flagged allergens detected'))).toBe(false);
    expect(lines.some((l) => l.startsWith('🟡') && l.includes('Peanut'))).toBe(true);
  });
});

describe('findBestWordBoundaryMatch', () => {
  it('matches case-insensitively and preserves slice bounds', () => {
    const specs = buildHighlightSpecs(['milk']);
    const hit = findBestWordBoundaryMatch('Contains MILK and salt.', specs);
    expect(hit).toEqual({ start: 9, end: 13, allergen: 'milk' });
  });
});

describe('mountPdpUi', () => {
  it('inserts banner and shadow highlight host with preserved casing', () => {
    document.body.innerHTML = `
      <div id="ing">
        <p id="p">Contains MILK and salt.</p>
      </div>
    `;
    const ing = document.getElementById('ing')!;
    const p = document.getElementById('p')!;
    const det: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: p.textContent ?? '',
      allergens: ['milk'],
      mayContain: [],
      confidence: 0.9,
      source: 'amazon_dom',
    };
    const dispose = mountPdpUi({
      insertBefore: ing,
      highlightRoot: ing,
      detection: det,
    });
    expect(document.querySelector(`[data-safesnack-pdp-banner]`)).toBeTruthy();
    const host = ing.querySelector('span[data-safesnack-hl]') as HTMLElement | null;
    expect(host).toBeTruthy();
    expect(host?.classList.contains('safesnack-hl-milk')).toBe(true);
    const mark = host?.shadowRoot?.querySelector('mark');
    expect(mark?.textContent).toBe('MILK');
    dispose();
    expect(ing.textContent).toContain('MILK');
    expect(ing.querySelector('span[data-safesnack-hl]')).toBeNull();
  });
});
