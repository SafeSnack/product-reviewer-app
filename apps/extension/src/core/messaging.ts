/** Typed messages between extension contexts (background ↔ popup ↔ content). */

export type SafeSnackMessage =
  | { type: 'ping'; requestId: string }
  | { type: 'pong'; requestId: string };
