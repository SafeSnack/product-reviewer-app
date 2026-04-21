import { DEFAULT_SETTINGS } from '@safesnack/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { usePopupStore } from './store.js';

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  subscribeToSettings: vi.fn(),
  getScannedTodayCount: vi.fn(),
  subscribeToScannedToday: vi.fn(),
  getHelpedProductCount: vi.fn(),
}));

vi.mock('../core/storage.js', () => ({
  getSettings: mocks.getSettings,
  saveSettings: mocks.saveSettings,
  subscribeToSettings: mocks.subscribeToSettings,
}));

vi.mock('../core/sessionScans.js', () => ({
  getScannedTodayCount: mocks.getScannedTodayCount,
  subscribeToScannedToday: mocks.subscribeToScannedToday,
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
    mocks.getScannedTodayCount.mockResolvedValue(3);
    mocks.subscribeToScannedToday.mockReturnValue(() => {});
    mocks.getHelpedProductCount.mockResolvedValue(2);
  });

  afterEach(() => {
    usePopupStore.getState().dispose();
  });

  it('bootstrap hydrates counts and wires settings subscription', async () => {
    await act(async () => {
      await usePopupStore.getState().bootstrap();
    });
    expect(mocks.getSettings).toHaveBeenCalled();
    expect(mocks.getScannedTodayCount).toHaveBeenCalled();
    expect(mocks.getHelpedProductCount).toHaveBeenCalled();
    expect(mocks.subscribeToSettings).toHaveBeenCalled();
    expect(mocks.subscribeToScannedToday).toHaveBeenCalled();
    expect(usePopupStore.getState().scannedToday).toBe(3);
    expect(usePopupStore.getState().helpedCount).toBe(2);
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
