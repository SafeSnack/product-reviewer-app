import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_OPT_IN_DEFAULT,
  IS_DEV,
  MODE,
  POSTHOG_CAPTURE_URL,
  SENTRY_DSN,
  SENTRY_ENV,
  SENTRY_THROW_ON_START,
} from './env.js';

describe('env', () => {
  it('exposes vite mode', () => {
    expect(typeof MODE).toBe('string');
    expect(typeof IS_DEV).toBe('boolean');
  });

  it('defaults remote analytics off for MVP', () => {
    expect(ANALYTICS_OPT_IN_DEFAULT).toBe(false);
    expect(typeof POSTHOG_CAPTURE_URL).toBe('string');
  });

  it('exposes Sentry env from Vite (empty DSN when unset)', () => {
    expect(typeof SENTRY_DSN).toBe('string');
    expect(typeof SENTRY_ENV).toBe('string');
    expect(typeof SENTRY_THROW_ON_START).toBe('boolean');
  });
});
