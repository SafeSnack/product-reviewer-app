export const IS_DEV = import.meta.env.DEV;
export const MODE = import.meta.env.MODE;

/** PostHog capture URL (e.g. `https://us.i.posthog.com/i/v0/e/`). Empty = remote capture disabled. */
export const POSTHOG_CAPTURE_URL =
  typeof import.meta.env.VITE_POSTHOG_CAPTURE_URL === 'string'
    ? import.meta.env.VITE_POSTHOG_CAPTURE_URL.trim()
    : '';

export const ANALYTICS_OPT_IN_DEFAULT = false;

export function isPostHogCaptureConfigured(): boolean {
  return POSTHOG_CAPTURE_URL.length > 0;
}
