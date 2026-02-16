'use client';

import { create } from 'zustand';

interface SettingsState {
  tabSize: 2 | 4;
  fontSize: number;
  setTabSize: (size: 2 | 4) => void;
  setFontSize: (size: number) => void;
}

function getStoredSettings() {
  if (typeof window === 'undefined') return { tabSize: 2 as const, fontSize: 15 };
  try {
    const stored = localStorage.getItem('pike-notes-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tabSize: (parsed.tabSize === 4 ? 4 : 2) as 2 | 4,
        fontSize: parsed.fontSize || 15,
      };
    }
  } catch {
    // ignore
  }
  return { tabSize: 2 as const, fontSize: 15 };
}

export const useSettingsStore = create<SettingsState>((set) => {
  const stored = getStoredSettings();
  return {
    tabSize: stored.tabSize,
    fontSize: stored.fontSize,

    setTabSize: (tabSize) => {
      set({ tabSize });
      const current = getStoredSettings();
      localStorage.setItem('pike-notes-settings', JSON.stringify({ ...current, tabSize }));
    },

    setFontSize: (fontSize) => {
      set({ fontSize });
      const current = getStoredSettings();
      localStorage.setItem('pike-notes-settings', JSON.stringify({ ...current, fontSize }));
    },
  };
});
