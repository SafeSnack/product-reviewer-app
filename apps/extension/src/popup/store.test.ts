import { DEFAULT_SETTINGS } from '@safesnack/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { usePopupStore } from './store.js';

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  subscribeToSettings: vi.fn(),
  getSessionCounters: vi.fn(),
  subscribeToSessionCounters: vi.fn(),
  getHelpedProductCount: vi.fn(),
}));

vi.mock('../core/storage.js', () => ({
  getSettings: mocks.getSettings,
  saveSettings: mocks.saveSettings,
  subscribeToSettings: mocks.subscribeToSettings,
}));

vi.mock('../services/analytics.js', () => ({
  getSessionCounters: mocks.getSessionCounters,
  subscribeToSessionCounters: mocks.subscribeToSessionCounters,
}));

vi.mock('../core/submissions.js', () => ({
  getHelpedProductCount: mocks.getHelpedProductCount,
}));

describe('popup store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue(DEFAULT_SETTINGS());
    mocks.saveSettings.mockResolvedValue(undefined);
    mocks.subscribeToSettings.mockReturnValue(() => {});
    mocks.getSessionCounters.mockResolvedValue({
      scansToday: 3,
      unsafeShown: 2,
      submissionsThisSession: 1,
    });
    mocks.subscribeToSessionCounters.mockReturnValue(() => {});
    mocks.getHelpedProductCount.mockResolvedValue(4);
  });

  afterEach(() => {
    usePopupStore.getState().dispose();
  });

  it('bootstrap hydrates counters and wires settings subscription', async () => {
    await act(async () => {
      await usePopupStore.getState().bootstrap();
    });
    expect(mocks.getSettings).toHaveBeenCalled();
    expect(mocks.getSessionCounters).toHaveBeenCalled();
    expect(mocks.getHelpedProductCount).toHaveBeenCalled();
    expect(mocks.subscribeToSettings).toHaveBeenCalled();
    expect(mocks.subscribeToSessionCounters).toHaveBeenCalled();
    expect(usePopupStore.getState().scansToday).toBe(3);
    expect(usePopupStore.getState().unsafeShown).toBe(2);
    expect(usePopupStore.getState().submissionsThisSession).toBe(1);
    expect(usePopupStore.getState().helpedCount).toBe(4);
  });

  it('toggleAllergen writes merged allergen list via saveSettings', async () => {
    const base = DEFAULT_SETTINGS();
    base.allergens = ['milk'];
    mocks.getSettings.mockResolvedValue(base);
    await act(async () => {
      await usePopupStore.getState().bootstrap();
    });
    await act(async () => {
      await usePopupStore.getState().toggleAllergen('peanut');
    });
    expect(mocks.saveSettings).toHaveBeenCalledWith({ allergens: ['milk', 'peanut'] });
  });
});
