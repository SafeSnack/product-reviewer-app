import type { BadgeState, DetectionResult } from '@safesnack/shared-types';

/**
 * Maps engine {@link DetectionResult} to UI badge state.
 * May-contain matches for the user's profile never show **Safe** (green); treat as Unknown until packaging is checked.
 */
export function badgeStateFromDetection(result: DetectionResult | null | undefined): BadgeState {
  if (!result || !result.ingredientsFound) {
    return 'unknown';
  }
  if (result.confidence < 0.5) {
    return 'unknown';
  }
  if (result.allergens.length > 0) {
    return 'unsafe';
  }
  if (result.mayContain.length > 0) {
    return 'unknown';
  }
  return 'safe';
}
