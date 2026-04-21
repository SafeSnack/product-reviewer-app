import type { AllergenKey, LocalSettings } from '@safesnack/shared-types';
import { ALL_ALLERGENS, DEFAULT_SETTINGS } from '@safesnack/shared-types';
import { create } from 'zustand';
import { getHelpedProductCount } from '../core/submissions.js';
import { getScannedTodayCount, subscribeToScannedToday } from '../core/sessionScans.js';
import { getSettings, saveSettings, subscribeToSettings } from '../core/storage.js';

const SUBMISSIONS_KEY = 'submissions' as const;

type Unsub = () => void;
const unsubs: Unsub[] = [];

function clearSubs(): void {
  while (unsubs.length > 0) {
    const u = unsubs.pop();
    try {
      u?.();
    } catch {
      // ignore
    }
  }
}

export type PopupStore = {
  settings: LocalSettings;
  scannedToday: number;
  helpedCount: number;
  allergenSectionOpen: boolean;
  setAllergenSectionOpen: (open: boolean) => void;
  toggleAllergen: (key: AllergenKey) => Promise<void>;
  bootstrap: () => Promise<void>;
  dispose: () => void;
};

export const usePopupStore = create<PopupStore>((set, get) => ({
  settings: DEFAULT_SETTINGS(),
  scannedToday: 0,
  helpedCount: 0,
  allergenSectionOpen: false,
  setAllergenSectionOpen: (open) => set({ allergenSectionOpen: open }),
  toggleAllergen: async (key) => {
    const { settings } = get();
    const next = new Set(settings.allergens);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    const allergens = ALL_ALLERGENS.filter((k) => next.has(k));
    await saveSettings({ allergens });
  },
  bootstrap: async () => {
    get().dispose();
    const [settings, scannedToday, helpedCount] = await Promise.all([
      getSettings(),
      getScannedTodayCount(),
      getHelpedProductCount(),
    ]);
    set({ settings, scannedToday, helpedCount });

    unsubs.push(
      subscribeToSettings((s) => {
        set({ settings: s });
      }),
    );
    unsubs.push(
      subscribeToScannedToday((n) => {
        set({ scannedToday: n });
      }),
    );
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const submissionsListener = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: chrome.storage.AreaName,
      ) => {
        if (area === 'local' && changes[SUBMISSIONS_KEY]) {
          void getHelpedProductCount().then((c) => set({ helpedCount: c }));
        }
      };
      chrome.storage.onChanged.addListener(submissionsListener);
      unsubs.push(() => {
        chrome.storage.onChanged.removeListener(submissionsListener);
      });
    }
  },
  dispose: () => {
    clearSubs();
  },
}));
