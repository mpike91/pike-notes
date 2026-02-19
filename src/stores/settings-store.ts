'use client';

import { create } from 'zustand';

interface SettingsState {
  tabSize: 2 | 4;
  fontSize: number;
  lineHeight: number;
  contentMaxWidth: number | null;
  fontFamily: string;
  homeNoteId: string | null;
  setTabSize: (size: 2 | 4) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setContentMaxWidth: (width: number | null) => void;
  setFontFamily: (family: string) => void;
  setHomeNoteId: (id: string | null) => void;
}

function getStoredSettings() {
  if (typeof window === 'undefined') return {
    tabSize: 2 as const,
    fontSize: 15,
    lineHeight: 1.5,
    contentMaxWidth: null as number | null,
    fontFamily: 'inter',
    homeNoteId: null as string | null,
  };
  try {
    const stored = localStorage.getItem('pike-notes-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tabSize: (parsed.tabSize === 4 ? 4 : 2) as 2 | 4,
        fontSize: parsed.fontSize || 15,
        lineHeight: parsed.lineHeight || 1.5,
        contentMaxWidth: parsed.contentMaxWidth ?? null,
        fontFamily: parsed.fontFamily || 'inter',
        homeNoteId: parsed.homeNoteId ?? null,
      };
    }
  } catch {
    // ignore
  }
  return {
    tabSize: 2 as const,
    fontSize: 15,
    lineHeight: 1.5,
    contentMaxWidth: null as number | null,
    fontFamily: 'inter',
    homeNoteId: null as string | null,
  };
}

function saveSettings(updates: Partial<SettingsState>) {
  const current = getStoredSettings();
  localStorage.setItem('pike-notes-settings', JSON.stringify({ ...current, ...updates }));
}

export const useSettingsStore = create<SettingsState>((set) => {
  const stored = getStoredSettings();
  return {
    tabSize: stored.tabSize,
    fontSize: stored.fontSize,
    lineHeight: stored.lineHeight,
    contentMaxWidth: stored.contentMaxWidth,
    fontFamily: stored.fontFamily,
    homeNoteId: stored.homeNoteId,

    setTabSize: (tabSize) => {
      set({ tabSize });
      saveSettings({ tabSize });
    },

    setFontSize: (fontSize) => {
      set({ fontSize });
      saveSettings({ fontSize });
    },

    setLineHeight: (lineHeight) => {
      set({ lineHeight });
      saveSettings({ lineHeight });
    },

    setContentMaxWidth: (contentMaxWidth) => {
      set({ contentMaxWidth });
      saveSettings({ contentMaxWidth });
    },

    setFontFamily: (fontFamily) => {
      set({ fontFamily });
      saveSettings({ fontFamily });
    },

    setHomeNoteId: (homeNoteId) => {
      set({ homeNoteId });
      saveSettings({ homeNoteId });
    },
  };
});
