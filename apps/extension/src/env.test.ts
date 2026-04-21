import { describe, it, expect } from 'vitest';
import { ANALYTICS_OPT_IN_DEFAULT, IS_DEV, MODE, POSTHOG_CAPTURE_URL } from './env.js';

describe('env', () => {
  it('exposes vite mode', () => {
    expect(typeof MODE).toBe('string');
    expect(typeof IS_DEV).toBe('boolean');
  });

  it('defaults remote analytics off for MVP', () => {
    expect(ANALYTICS_OPT_IN_DEFAULT).toBe(false);
    expect(typeof POSTHOG_CAPTURE_URL).toBe('string');
  });
});
