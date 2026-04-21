import type { DetectionResult } from '@safesnack/shared-types';
import { describe, expect, it } from 'vitest';

import { badgeStateFromDetection } from './badgeState.js';

const SRC = 'amazon_dom' as const;

describe('badgeStateFromDetection', () => {
  it('unknown when no ingredients', () => {
    const d: DetectionResult = {
      ingredientsFound: false,
      ingredientsText: null,
      allergens: [],
      mayContain: [],
      confidence: 0,
      source: SRC,
    };
    expect(badgeStateFromDetection(d)).toBe('unknown');
  });

  it('unknown when confidence below threshold', () => {
    const d: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'x',
      allergens: [],
      mayContain: [],
      confidence: 0.4,
      source: SRC,
    };
    expect(badgeStateFromDetection(d)).toBe('unknown');
  });

  it('unsafe when contains target allergen', () => {
    const d: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'milk',
      allergens: ['milk'],
      mayContain: [],
      confidence: 1,
      source: SRC,
    };
    expect(badgeStateFromDetection(d)).toBe('unsafe');
  });

  it('unknown when only may-contain hits profile (never false-safe green)', () => {
    const d: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'sugar. may contain peanuts.',
      allergens: [],
      mayContain: ['peanut'],
      confidence: 0.6,
      source: SRC,
    };
    expect(badgeStateFromDetection(d)).toBe('unknown');
  });

  it('safe when confident clear contains list', () => {
    const d: DetectionResult = {
      ingredientsFound: true,
      ingredientsText: 'water, salt.',
      allergens: [],
      mayContain: [],
      confidence: 1,
      source: SRC,
    };
    expect(badgeStateFromDetection(d)).toBe('safe');
  });
});
