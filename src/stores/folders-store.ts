'use client';

import { create } from 'zustand';
import type { Folder } from '@/types';
import { getDescendantIds } from '@/lib/folder-utils';

function getStoredExpandedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('pike-notes-expanded-folders');
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function saveExpandedIds(ids: Set<string>) {
  localStorage.setItem('pike-notes-expanded-folders', JSON.stringify([...ids]));
}

interface FoldersState {
  folders: Folder[];
  selectedFolderId: string | null;
  showUnfiled: boolean;
  expandedFolderIds: Set<string>;

  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  removeFolder: (id: string) => void;
  removeFolderAndDescendants: (id: string) => void;
  setSelectedFolderId: (id: string | null) => void;
  setShowUnfiled: (value: boolean) => void;
  toggleFolderExpanded: (id: string) => void;
  expandFolder: (id: string) => void;
}

const storedExpanded = getStoredExpandedIds();

export const useFoldersStore = create<FoldersState>((set) => ({
  folders: [],
  selectedFolderId: null,
  showUnfiled: false,
  expandedFolderIds: storedExpanded,

  setFolders: (folders) => set({ folders }),

  addFolder: (folder) =>
    set((state) => {
      if (state.folders.some((f) => f.id === folder.id)) return state;
      return { folders: [...state.folders, folder] };
    }),

  updateFolder: (id, updates) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    })),

  removeFolderAndDescendants: (id) =>
    set((state) => {
      const descendantIds = getDescendantIds(state.folders, id);
      const idsToRemove = new Set([id, ...descendantIds]);
      return {
        folders: state.folders.filter((f) => !idsToRemove.has(f.id)),
        selectedFolderId: idsToRemove.has(state.selectedFolderId ?? '') ? null : state.selectedFolderId,
      };
    }),

  setSelectedFolderId: (id) => set({ selectedFolderId: id, ...(id != null && { showUnfiled: false }) }),

  setShowUnfiled: (value) => set({ showUnfiled: value, ...(value && { selectedFolderId: null }) }),

  toggleFolderExpanded: (id) =>
    set((state) => {
      const next = new Set(state.expandedFolderIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveExpandedIds(next);
      return { expandedFolderIds: next };
    }),

  expandFolder: (id) =>
    set((state) => {
      if (state.expandedFolderIds.has(id)) return state;
      const next = new Set(state.expandedFolderIds);
      next.add(id);
      saveExpandedIds(next);
      return { expandedFolderIds: next };
    }),
}));
