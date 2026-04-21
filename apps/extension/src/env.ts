export const IS_DEV = import.meta.env.DEV;
export const MODE = import.meta.env.MODE;

/** Sentry DSN for `@sentry/browser` in background + content (empty = disabled). Injected via Vite from `apps/extension/.env`. */
export const SENTRY_DSN =
  typeof import.meta.env.VITE_SENTRY_DSN === 'string' ? import.meta.env.VITE_SENTRY_DSN.trim() : '';

/** Sentry environment tag (e.g. `production`). Defaults to Vite `MODE`. */
export const SENTRY_ENV =
  typeof import.meta.env.VITE_SENTRY_ENV === 'string' &&
  import.meta.env.VITE_SENTRY_ENV.trim() !== ''
    ? import.meta.env.VITE_SENTRY_ENV.trim()
    : import.meta.env.MODE;

/** When `1`, background worker throws once after init to verify Sentry delivery (dev/staging only). */
export const SENTRY_THROW_ON_START = import.meta.env.VITE_SENTRY_THROW_ON_START === '1';

/** PostHog capture URL (e.g. `https://us.i.posthog.com/i/v0/e/`). Empty = remote capture disabled. */
export const POSTHOG_CAPTURE_URL =
  typeof import.meta.env.VITE_POSTHOG_CAPTURE_URL === 'string'
    ? import.meta.env.VITE_POSTHOG_CAPTURE_URL.trim()
    : '';

export const ANALYTICS_OPT_IN_DEFAULT = false;

export function isPostHogCaptureConfigured(): boolean {
  return POSTHOG_CAPTURE_URL.length > 0;
}
