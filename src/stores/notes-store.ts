'use client';

import { create } from 'zustand';
import type { Note, TodoItem, NoteFilter, SortBy, SortDirection } from '@/types';

function getStoredSort(): { sortBy: SortBy; sortDirection: SortDirection } {
  if (typeof window === 'undefined') return { sortBy: 'updated_at', sortDirection: 'desc' };
  try {
    const stored = localStorage.getItem('pike-notes-sort');
    if (stored) {
      const parsed = JSON.parse(stored);
      const sortBy = (['updated_at', 'created_at', 'title'] as SortBy[]).includes(parsed.sortBy)
        ? parsed.sortBy : 'updated_at';
      const sortDirection = parsed.sortDirection === 'asc' ? 'asc' : 'desc';
      return { sortBy, sortDirection };
    }
  } catch { /* ignore */ }
  return { sortBy: 'updated_at', sortDirection: 'desc' };
}

function saveSort(sortBy: SortBy, sortDirection: SortDirection) {
  localStorage.setItem('pike-notes-sort', JSON.stringify({ sortBy, sortDirection }));
}

interface NotesState {
  notes: Note[];
  todoItems: Record<string, TodoItem[]>; // keyed by note_id
  currentNoteId: string | null;
  filter: NoteFilter;
  sortBy: SortBy;
  sortDirection: SortDirection;
  isLoading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setCurrentNoteId: (id: string | null) => void;
  setFilter: (filter: NoteFilter) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortDirection: (direction: SortDirection) => void;
  setIsLoading: (loading: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;

  setTodoItems: (noteId: string, items: TodoItem[]) => void;
  addTodoItem: (item: TodoItem) => void;
  updateTodoItem: (id: string, noteId: string, updates: Partial<TodoItem>) => void;
  removeTodoItem: (id: string, noteId: string) => void;
}

const storedSort = getStoredSort();

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  todoItems: {},
  currentNoteId: null,
  filter: 'all',
  sortBy: storedSort.sortBy,
  sortDirection: storedSort.sortDirection,
  isLoading: true,
  saveStatus: 'idle',

  setNotes: (notes) => set({ notes }),

  addNote: (note) =>
    set((state) => {
      if (state.notes.some((n) => n.id === note.id)) return state;
      return { notes: [note, ...state.notes] };
    }),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),

  setCurrentNoteId: (id) => set({ currentNoteId: id }),

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set((state) => {
    saveSort(sortBy, state.sortDirection);
    return { sortBy };
  }),
  setSortDirection: (direction) => set((state) => {
    saveSort(state.sortBy, direction);
    return { sortDirection: direction };
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSaveStatus: (status) => set({ saveStatus: status }),

  setTodoItems: (noteId, items) =>
    set((state) => ({
      todoItems: { ...state.todoItems, [noteId]: items },
    })),

  addTodoItem: (item) =>
    set((state) => {
      const existing = state.todoItems[item.note_id] || [];
      if (existing.some((t) => t.id === item.id)) return state;
      return {
        todoItems: {
          ...state.todoItems,
          [item.note_id]: [...existing, item],
        },
      };
    }),

  updateTodoItem: (id, noteId, updates) =>
    set((state) => ({
      todoItems: {
        ...state.todoItems,
        [noteId]: (state.todoItems[noteId] || []).map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      },
    })),

  removeTodoItem: (id, noteId) =>
    set((state) => ({
      todoItems: {
        ...state.todoItems,
        [noteId]: (state.todoItems[noteId] || []).filter((t) => t.id !== id),
      },
    })),
}));
