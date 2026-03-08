'use client';

import { create } from 'zustand';
import type { Theme } from '@/types';
import { ACCENT_PALETTES } from '@/lib/accent-colors';

interface UIState {
  theme: Theme;
  accentColor: string | null;
  sidebarCollapsed: boolean;
  focusModeActive: boolean;
  mobileNavOpen: boolean;

  // Split view
  splitViewActive: boolean;
  splitViewFocusedPane: 'left' | 'right';
  splitViewLeftNoteId: string | null;
  splitViewRightNoteId: string | null;

  setTheme: (theme: Theme) => void;
  setAccentColor: (key: string | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFocusMode: () => void;
  setFocusModeActive: (active: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;

  // Split view actions
  toggleSplitView: (currentNoteId?: string | null) => void;
  setSplitViewFocusedPane: (pane: 'left' | 'right') => void;
  setSplitViewNoteId: (pane: 'left' | 'right', id: string | null) => void;
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  let theme = (localStorage.getItem('pike-notes-theme') as string) || 'light';
  if (theme === 'dark-dark-gray' || theme === 'dark-light-gray') {
    theme = 'dark-gray';
    localStorage.setItem('pike-notes-theme', theme);
  } else if (theme === 'light-contrast') {
    theme = 'light';
    localStorage.setItem('pike-notes-theme', theme);
  }
  return theme as Theme;
}

function getStoredSidebar(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pike-notes-sidebar-collapsed') === 'true';
}

function getStoredAccentColor(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pike-notes-accent-color') || null;
}

function applyAccentColor(theme: Theme, key: string | null) {
  if (typeof window === 'undefined') return;
  const el = document.documentElement.style;
  if (!key || key === 'default') {
    el.removeProperty('--accent');
    el.removeProperty('--accent-hover');
    return;
  }
  const palette = ACCENT_PALETTES[theme];
  const option = palette?.find((o) => o.key === key);
  if (!option) {
    el.removeProperty('--accent');
    el.removeProperty('--accent-hover');
    return;
  }
  el.setProperty('--accent', option.color);
  el.setProperty('--accent-hover', option.hoverColor);
}

// PWA title bar colors — slightly darker than sidebar-bg for contrast
const THEME_COLORS: Record<string, string> = {
  'light': '#d9dade',
  'dark-gray': '#1b1b1f',
  'dark-slate': '#13171f',
  'dark-wine': '#1a1015',
  'dark-moss': '#121812',
  'dark-coffee': '#201e1a',
};

const initialTheme = getStoredTheme();
const initialAccent = getStoredAccentColor();
applyAccentColor(initialTheme, initialAccent);

export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme,
  accentColor: initialAccent,
  sidebarCollapsed: getStoredSidebar(),
  focusModeActive: false,
  mobileNavOpen: false,

  // Split view defaults
  splitViewActive: false,
  splitViewFocusedPane: 'left',
  splitViewLeftNoteId: null,
  splitViewRightNoteId: null,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pike-notes-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || '#ffffff');
    // Reset accent on theme change
    localStorage.removeItem('pike-notes-accent-color');
    localStorage.removeItem('pike-notes-accent-values');
    applyAccentColor(theme, null);
    set({ theme, accentColor: null });
  },

  setAccentColor: (key) => {
    const theme = get().theme;
    applyAccentColor(theme, key);
    if (!key || key === 'default') {
      localStorage.removeItem('pike-notes-accent-color');
      localStorage.removeItem('pike-notes-accent-values');
    } else {
      localStorage.setItem('pike-notes-accent-color', key);
      const palette = ACCENT_PALETTES[theme];
      const option = palette?.find((o) => o.key === key);
      if (option) {
        localStorage.setItem('pike-notes-accent-values', JSON.stringify({
          accent: option.color,
          accentHover: option.hoverColor,
        }));
      }
    }
    set({ accentColor: key });
  },

  toggleSidebar: () =>
    set((state) => {
      const collapsed = !state.sidebarCollapsed;
      localStorage.setItem('pike-notes-sidebar-collapsed', String(collapsed));
      return { sidebarCollapsed: collapsed };
    }),

  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('pike-notes-sidebar-collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },

  toggleFocusMode: () =>
    set((state) => ({ focusModeActive: !state.focusModeActive })),

  setFocusModeActive: (active) => set({ focusModeActive: active }),

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  toggleSplitView: (currentNoteId) =>
    set((state) => {
      if (state.splitViewActive) {
        // Turning OFF — reset split view state
        return {
          splitViewActive: false,
          splitViewLeftNoteId: null,
          splitViewRightNoteId: null,
          splitViewFocusedPane: 'left' as const,
        };
      }
      // Turning ON — move current note to left pane, right pane is null (shows list)
      return {
        splitViewActive: true,
        splitViewLeftNoteId: currentNoteId ?? null,
        splitViewRightNoteId: null,
        splitViewFocusedPane: 'left',
      };
    }),

  setSplitViewFocusedPane: (pane) => set({ splitViewFocusedPane: pane }),

  setSplitViewNoteId: (pane, id) =>
    set(pane === 'left' ? { splitViewLeftNoteId: id } : { splitViewRightNoteId: id }),
}));
