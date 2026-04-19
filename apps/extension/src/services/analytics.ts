/**
 * Analytics stub — external analytics stay off for MVP (see SAFESNACK_PRD.md).
 */

export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  void eventName;
  void payload;
}
