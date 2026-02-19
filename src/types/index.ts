export type { Note, NoteInsert, NoteUpdate, TodoItem, TodoItemInsert, TodoItemUpdate, Tag, NoteTag } from '@/lib/supabase/types';

export type Theme = 'light' | 'light-contrast' | 'dark-light-gray' | 'dark-dark-gray' | 'dark-slate';

export type NoteFilter = 'all' | 'todos' | 'archived' | 'trashed';

export type SortBy = 'updated_at' | 'created_at' | 'title';
export type SortDirection = 'asc' | 'desc';
