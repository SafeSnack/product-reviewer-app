import type { LocalSettings } from './types.js';
import { DEFAULT_SETTINGS } from '@safesnack/shared-types';

const SETTINGS_KEY = 'localSettings' as const;

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.sync);
}

export async function readLocalSettings(): Promise<LocalSettings> {
  if (!hasChromeStorage()) {
    return DEFAULT_SETTINGS();
  }
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  const raw = stored[SETTINGS_KEY];
  if (raw && typeof raw === 'object') {
    return raw as LocalSettings;
  }
  return DEFAULT_SETTINGS();
}

export async function writeLocalSettings(settings: LocalSettings): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}
