'use client';

import { create } from 'zustand';
import type { Theme } from '@/types';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  focusModeActive: boolean;
  mobileNavOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFocusMode: () => void;
  setFocusModeActive: (active: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('pike-notes-theme') as Theme) || 'light';
}

function getStoredSidebar(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pike-notes-sidebar-collapsed') === 'true';
}

export const useUIStore = create<UIState>((set) => ({
  theme: getStoredTheme(),
  sidebarCollapsed: getStoredSidebar(),
  focusModeActive: false,
  mobileNavOpen: false,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pike-notes-theme', theme);
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
}));
