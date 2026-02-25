'use client';

import { create } from 'zustand';

interface SizingSettings {
  fontSize: number;
  lineHeight: number;
  contentMaxWidth: number | null;
}

export interface SettingsJson {
  theme?: string;
  tabSize?: number;
  fontFamily?: string;
  homeNoteId?: string | null;
  hangingIndent?: boolean;
  mobile?: Partial<SizingSettings>;
  desktop?: Partial<SizingSettings>;
}

interface SettingsState {
  // Shared settings
  tabSize: 2 | 4;
  fontFamily: string;
  homeNoteId: string | null;
  hangingIndent: boolean;

  // Device-specific sizing (exposed via getters below)
  _mobile: SizingSettings;
  _desktop: SizingSettings;

  // Computed getters for current device
  fontSize: number;
  lineHeight: number;
  contentMaxWidth: number | null;

  // Setters
  setTabSize: (size: 2 | 4) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setContentMaxWidth: (width: number | null) => void;
  setFontFamily: (family: string) => void;
  setHomeNoteId: (id: string | null) => void;
  setHangingIndent: (enabled: boolean) => void;

  // Sync methods
  _loadFromJson: (json: SettingsJson) => void;
  _toJson: (theme: string) => SettingsJson;
  _isMobile: () => boolean;
}

const DEFAULT_SIZING: SizingSettings = {
  fontSize: 15,
  lineHeight: 1.5,
  contentMaxWidth: null,
};

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

function getStoredSettings() {
  if (typeof window === 'undefined') return {
    tabSize: 2 as const,
    fontFamily: 'inter',
    homeNoteId: null as string | null,
    hangingIndent: false,
    _mobile: { ...DEFAULT_SIZING },
    _desktop: { ...DEFAULT_SIZING },
  };
  try {
    const stored = localStorage.getItem('pike-notes-settings');
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migration: if old flat format (has fontSize at top level but no mobile/desktop),
      // treat existing values as both mobile and desktop defaults
      if (parsed.fontSize && !parsed.mobile && !parsed.desktop) {
        const sizing: SizingSettings = {
          fontSize: parsed.fontSize || 15,
          lineHeight: parsed.lineHeight || 1.5,
          contentMaxWidth: parsed.contentMaxWidth ?? null,
        };
        return {
          tabSize: (parsed.tabSize === 4 ? 4 : 2) as 2 | 4,
          fontFamily: parsed.fontFamily || 'inter',
          homeNoteId: parsed.homeNoteId ?? null,
          hangingIndent: parsed.hangingIndent ?? false,
          _mobile: { ...sizing },
          _desktop: { ...sizing },
        };
      }

      return {
        tabSize: (parsed.tabSize === 4 ? 4 : 2) as 2 | 4,
        fontFamily: parsed.fontFamily || 'inter',
        homeNoteId: parsed.homeNoteId ?? null,
        hangingIndent: parsed.hangingIndent ?? false,
        _mobile: {
          fontSize: parsed.mobile?.fontSize ?? parsed.fontSize ?? 15,
          lineHeight: parsed.mobile?.lineHeight ?? parsed.lineHeight ?? 1.5,
          contentMaxWidth: parsed.mobile?.contentMaxWidth ?? parsed.contentMaxWidth ?? null,
        },
        _desktop: {
          fontSize: parsed.desktop?.fontSize ?? parsed.fontSize ?? 15,
          lineHeight: parsed.desktop?.lineHeight ?? parsed.lineHeight ?? 1.5,
          contentMaxWidth: parsed.desktop?.contentMaxWidth ?? parsed.contentMaxWidth ?? null,
        },
      };
    }
  } catch {
    // ignore
  }
  return {
    tabSize: 2 as const,
    fontFamily: 'inter',
    homeNoteId: null as string | null,
    hangingIndent: false,
    _mobile: { ...DEFAULT_SIZING },
    _desktop: { ...DEFAULT_SIZING },
  };
}

function saveSettings(state: SettingsState) {
  const json: Record<string, unknown> = {
    tabSize: state.tabSize,
    fontFamily: state.fontFamily,
    homeNoteId: state.homeNoteId,
    hangingIndent: state.hangingIndent,
    mobile: state._mobile,
    desktop: state._desktop,
  };
  localStorage.setItem('pike-notes-settings', JSON.stringify(json));
}

function getCurrentSizing(state: { _mobile: SizingSettings; _desktop: SizingSettings }) {
  return isMobile() ? state._mobile : state._desktop;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const stored = getStoredSettings();
  const initialSizing = getCurrentSizing(stored);

  return {
    tabSize: stored.tabSize,
    fontFamily: stored.fontFamily,
    homeNoteId: stored.homeNoteId,
    hangingIndent: stored.hangingIndent,
    _mobile: stored._mobile,
    _desktop: stored._desktop,

    // Current device sizing
    fontSize: initialSizing.fontSize,
    lineHeight: initialSizing.lineHeight,
    contentMaxWidth: initialSizing.contentMaxWidth,

    _isMobile: isMobile,

    setTabSize: (tabSize) => {
      set({ tabSize });
      saveSettings({ ...get(), tabSize });
    },

    setFontSize: (fontSize) => {
      const mobile = isMobile();
      const updates = mobile
        ? { _mobile: { ...get()._mobile, fontSize }, fontSize }
        : { _desktop: { ...get()._desktop, fontSize }, fontSize };
      set(updates);
      saveSettings({ ...get(), ...updates });
    },

    setLineHeight: (lineHeight) => {
      const mobile = isMobile();
      const updates = mobile
        ? { _mobile: { ...get()._mobile, lineHeight }, lineHeight }
        : { _desktop: { ...get()._desktop, lineHeight }, lineHeight };
      set(updates);
      saveSettings({ ...get(), ...updates });
    },

    setContentMaxWidth: (contentMaxWidth) => {
      const mobile = isMobile();
      const updates = mobile
        ? { _mobile: { ...get()._mobile, contentMaxWidth }, contentMaxWidth }
        : { _desktop: { ...get()._desktop, contentMaxWidth }, contentMaxWidth };
      set(updates);
      saveSettings({ ...get(), ...updates });
    },

    setFontFamily: (fontFamily) => {
      set({ fontFamily });
      saveSettings({ ...get(), fontFamily });
    },

    setHomeNoteId: (homeNoteId) => {
      set({ homeNoteId });
      saveSettings({ ...get(), homeNoteId });
    },

    setHangingIndent: (hangingIndent) => {
      set({ hangingIndent });
      saveSettings({ ...get(), hangingIndent });
    },

    _loadFromJson: (json: SettingsJson) => {
      const mobile = json.mobile ?? {};
      const desktop = json.desktop ?? {};
      const _mobile: SizingSettings = {
        fontSize: mobile.fontSize ?? DEFAULT_SIZING.fontSize,
        lineHeight: mobile.lineHeight ?? DEFAULT_SIZING.lineHeight,
        contentMaxWidth: mobile.contentMaxWidth ?? DEFAULT_SIZING.contentMaxWidth,
      };
      const _desktop: SizingSettings = {
        fontSize: desktop.fontSize ?? DEFAULT_SIZING.fontSize,
        lineHeight: desktop.lineHeight ?? DEFAULT_SIZING.lineHeight,
        contentMaxWidth: desktop.contentMaxWidth ?? DEFAULT_SIZING.contentMaxWidth,
      };
      const sizing = isMobile() ? _mobile : _desktop;
      set({
        tabSize: (json.tabSize === 4 ? 4 : 2) as 2 | 4,
        fontFamily: json.fontFamily || 'inter',
        homeNoteId: json.homeNoteId ?? null,
        hangingIndent: json.hangingIndent ?? false,
        _mobile,
        _desktop,
        fontSize: sizing.fontSize,
        lineHeight: sizing.lineHeight,
        contentMaxWidth: sizing.contentMaxWidth,
      });
      saveSettings(get());
    },

    _toJson: (theme: string): SettingsJson => {
      const state = get();
      return {
        theme,
        tabSize: state.tabSize,
        fontFamily: state.fontFamily,
        homeNoteId: state.homeNoteId,
        hangingIndent: state.hangingIndent,
        mobile: state._mobile,
        desktop: state._desktop,
      };
    },
  };
});
