import { DEFAULT_SETTINGS } from '@safesnack/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Onboarding } from './Onboarding.js';

const { getSettings, saveSettings } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));

vi.mock('../core/storage.js', () => ({
  getSettings,
  saveSettings,
}));

describe('Onboarding', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    getSettings.mockResolvedValue(DEFAULT_SETTINGS());
    saveSettings.mockResolvedValue(undefined);
    vi.stubGlobal('chrome', {
      tabs: { create: vi.fn().mockResolvedValue(undefined) },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  /** Drain microtasks + passive effects (`useEffect`) after state updates. */
  async function flushAfterUpdate(): Promise<void> {
    for (let i = 0; i < 12; i += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  }

  async function clickAndFlush(el: Element | null | undefined): Promise<void> {
    await act(async () => {
      (el as HTMLElement | undefined)?.click();
    });
    await flushAfterUpdate();
  }

  it('runs 3 steps, persists allergens on step 2 completion', async () => {
    await act(async () => {
      root.render(<Onboarding />);
    });
    await flushAfterUpdate();

    expect(container.textContent).toContain('Shop groceries online');

    const start = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Get started'),
    );
    expect(start).toBeTruthy();
    await clickAndFlush(start ?? null);

    expect(container.textContent).toContain('Pick your allergens');

    const chips = container.querySelectorAll('[role="checkbox"]');
    expect(chips.length).toBe(10);

    await clickAndFlush(chips[0] ?? null);

    const continueBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Continue'),
    );
    expect(continueBtn).toBeTruthy();
    expect((continueBtn as HTMLButtonElement).disabled).toBe(false);

    await clickAndFlush(continueBtn ?? null);

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingCompleted: true,
        allergens: ['milk'],
      }),
    );

    expect(container.textContent).toContain("You're protected for: Milk");
    expect(container.textContent).toContain('Shop Amazon Fresh');
  });

  it('toggles allergen with keyboard Space on role=checkbox', async () => {
    await act(async () => {
      root.render(<Onboarding />);
    });
    await flushAfterUpdate();

    const start = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Get started'),
    );
    await clickAndFlush(start ?? null);

    const firstChip = container.querySelector('[role="checkbox"]') as HTMLElement | null;
    expect(firstChip).toBeTruthy();

    await act(async () => {
      firstChip?.focus();
      firstChip?.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      );
    });
    await flushAfterUpdate();

    expect(firstChip?.getAttribute('aria-checked')).toBe('true');
  });
});
