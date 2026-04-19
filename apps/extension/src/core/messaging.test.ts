import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from './messaging.js';

function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

describe('messaging', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  it('sendMessage resolves when runtime returns a reply', async () => {
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: vi.fn((_m: Message, cb?: (r: unknown) => void) => {
          queueMicrotask(() => {
            cb?.({
              type: 'LOOKUP_RESULT',
              productKey: 'amazon:B07',
              result: null,
            });
          });
        }),
      },
    });
    const { sendMessage } = await import('./messaging.js');
    const replyPromise = sendMessage({
      type: 'LOOKUP_PRODUCT',
      productKey: 'amazon:B07',
      productName: 'Test',
    });
    await flushMicrotasks();
    const reply = await replyPromise;
    expect(reply.type).toBe('LOOKUP_RESULT');
    if (reply.type !== 'LOOKUP_RESULT') {
      throw new Error('expected LOOKUP_RESULT');
    }
    expect(reply.productKey).toBe('amazon:B07');
  });

  it('sendMessage rejects on timeout when no response', async () => {
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: vi.fn(() => {
          /* never invokes callback */
        }),
      },
    });
    const { sendMessage, MESSAGE_TIMEOUT_MS } = await import('./messaging.js');
    const p = sendMessage({
      type: 'LOOKUP_PRODUCT',
      productKey: 'k',
      productName: 'n',
    });
    vi.advanceTimersByTime(MESSAGE_TIMEOUT_MS);
    await expect(p).rejects.toThrow('SafeSnack messaging timeout');
  });

  it('sendMessage rejects when chrome.runtime.lastError is set', async () => {
    const runtime: {
      lastError?: { message: string };
      sendMessage: (m: Message, cb?: (r: unknown) => void) => void;
    } = {
      lastError: undefined,
      sendMessage(_m, cb) {
        runtime.lastError = { message: 'no receiver' };
        cb?.(undefined);
        runtime.lastError = undefined;
      },
    };
    vi.stubGlobal('chrome', { runtime });
    const { sendMessage } = await import('./messaging.js');
    const p = sendMessage({
      type: 'LOOKUP_PRODUCT',
      productKey: 'k',
      productName: 'n',
    });
    await expect(p).rejects.toThrow('no receiver');
  });

  it('sendMessage rejects when chrome.runtime is missing', async () => {
    vi.stubGlobal('chrome', { runtime: {} });
    const { sendMessage } = await import('./messaging.js');
    await expect(
      sendMessage({ type: 'LOOKUP_PRODUCT', productKey: 'k', productName: 'n' }),
    ).rejects.toThrow('SafeSnack messaging unavailable');
  });

  it('onMessage runs handler and passes reply to sendResponse', async () => {
    let storedListener:
      | ((
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (r?: unknown) => void,
        ) => boolean)
      | undefined;

    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: {
          addListener: (fn: typeof storedListener) => {
            storedListener = fn;
          },
        },
      },
    });

    const { onMessage } = await import('./messaging.js');
    const handler = vi.fn(async (m: Message) => {
      if (m.type === 'LOOKUP_PRODUCT') {
        return {
          type: 'LOOKUP_RESULT',
          productKey: m.productKey,
          result: null,
        } satisfies Message;
      }
      return undefined;
    });

    onMessage(handler);

    const sendResponse = vi.fn();
    const msg = { type: 'LOOKUP_PRODUCT', productKey: 'amazon:1', productName: 'N' } as const;
    const keepOpen = storedListener?.(msg, {} as chrome.runtime.MessageSender, sendResponse);
    expect(keepOpen).toBe(true);

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse.mock.calls[0]![0]).toEqual({
      type: 'LOOKUP_RESULT',
      productKey: 'amazon:1',
      result: null,
    });
  });

  it('isMessage narrows known payloads', async () => {
    const { isMessage } = await import('./messaging.js');
    expect(isMessage({ type: 'LOOKUP_PRODUCT', productKey: 'k', productName: 'x' })).toBe(true);
    expect(isMessage({ type: 'OTHER', x: 1 })).toBe(false);
    expect(isMessage(null)).toBe(false);
  });
});
