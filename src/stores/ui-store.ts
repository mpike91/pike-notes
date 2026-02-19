'use client';

import { create } from 'zustand';
import type { Theme } from '@/types';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  focusModeActive: boolean;
  mobileNavOpen: boolean;

  // Split view
  splitViewActive: boolean;
  splitViewFocusedPane: 'left' | 'right';
  splitViewLeftNoteId: string | null;
  splitViewRightNoteId: string | null;

  setTheme: (theme: Theme) => void;
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

// PWA title bar colors — slightly darker than sidebar-bg for contrast
const THEME_COLORS: Record<string, string> = {
  'light': '#eaebec',
  'dark-gray': '#18181c',
  'dark-slate': '#10141c',
  'dark-wine': '#110d0f',
  'dark-moss': '#0f130f',
};

export const useUIStore = create<UIState>((set) => ({
  theme: getStoredTheme(),
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
    set({ theme });
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
