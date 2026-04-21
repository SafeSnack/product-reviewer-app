import { describe, expect, it } from 'vitest';

import { scrubSentryEventForPrivacy, shouldDropKnownAmazonDomNoise } from './sentry.js';

describe('sentry privacy scrubber', () => {
  it('strips query and hash from http URLs on request and tags', () => {
    const event = {
      request: { url: 'https://www.amazon.com/s?k=milk&ref=nb_sb' },
      tags: { url: 'https://www.amazon.com/dp/B000TEST00?foo=1' },
      extra: { userTyped: 'secret' },
    };
    scrubSentryEventForPrivacy(event);
    expect(event.request?.url).toBe('https://www.amazon.com/s');
    expect(event.tags?.url).toBe('https://www.amazon.com/dp/B000TEST00');
    expect(event.extra).toBeUndefined();
  });

  it('truncates long exception values', () => {
    const long = 'x'.repeat(900);
    const event = {
      exception: { values: [{ value: long }] },
    };
    scrubSentryEventForPrivacy(event);
    expect(event.exception?.values?.[0]?.value?.length).toBeLessThanOrEqual(520);
    expect(event.exception?.values?.[0]?.value).toContain('[truncated]');
  });
});

describe('Amazon DOM noise filter', () => {
  it('drops ResizeObserver loop errors', () => {
    expect(
      shouldDropKnownAmazonDomNoise({
        exception: { values: [{ value: 'ResizeObserver loop limit exceeded' }] },
      }),
    ).toBe(true);
  });

  it('keeps real extension errors', () => {
    expect(
      shouldDropKnownAmazonDomNoise({
        exception: { values: [{ value: 'SafeSnack lookup failed: timeout' }] },
      }),
    ).toBe(false);
  });
});
