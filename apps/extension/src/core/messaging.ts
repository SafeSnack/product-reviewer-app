import type { DetectionResult, LocalSettings } from '@safesnack/shared-types';

export const MESSAGE_TIMEOUT_MS = 5000;

export type LookupRequest = {
  type: 'LOOKUP_PRODUCT';
  productKey: string;
  productName: string;
  ingredientsFromDom?: string | null;
};

export type LookupResponse = {
  type: 'LOOKUP_RESULT';
  productKey: string;
  result: DetectionResult | null;
  error?: string;
};

export type SettingsChanged = {
  type: 'SETTINGS_CHANGED';
  settings: LocalSettings;
};

export type Message = LookupRequest | LookupResponse | SettingsChanged;

const MESSAGE_TYPES = new Set<Message['type']>([
  'LOOKUP_PRODUCT',
  'LOOKUP_RESULT',
  'SETTINGS_CHANGED',
]);

export function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const t = (value as { type?: unknown }).type;
  return typeof t === 'string' && MESSAGE_TYPES.has(t as Message['type']);
}

/**
 * Sends a typed message to the extension service worker.
 * Works from content scripts and the popup; rejects after {@link MESSAGE_TIMEOUT_MS}.
 */
export function sendMessage<R extends Message>(m: Message): Promise<R> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    return Promise.reject(new Error('SafeSnack messaging unavailable'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error('SafeSnack messaging timeout'));
    }, MESSAGE_TIMEOUT_MS);

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      globalThis.clearTimeout(timer);
      fn();
    };

    try {
      chrome.runtime.sendMessage(m, (response: unknown) => {
        const err = chrome.runtime.lastError;
        finish(() => {
          if (err?.message) {
            reject(new Error(err.message));
          } else {
            resolve(response as R);
          }
        });
      });
    } catch (e) {
      finish(() => {
        reject(e instanceof Error ? e : new Error(String(e)));
      });
    }
  });
}

/**
 * Registers a listener for SafeSnack messages (typically in the service worker).
 * Non-SafeSnack messages are ignored so other listeners can handle them.
 */
export function onMessage(
  handler: (m: Message, sender: chrome.runtime.MessageSender) => Promise<Message | void>,
): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
    return;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isMessage(message)) {
      return false;
    }

    void (async () => {
      try {
        const reply = await handler(message, sender);
        sendResponse(reply ?? undefined);
      } catch {
        sendResponse(undefined);
      }
    })();

    return true;
  });
}
