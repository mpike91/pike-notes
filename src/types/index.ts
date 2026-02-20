export type { Note, NoteInsert, NoteUpdate, TodoItem, TodoItemInsert, TodoItemUpdate, Tag, NoteTag } from '@/lib/supabase/types';

export type Theme = 'light' | 'dark-gray' | 'dark-slate' | 'dark-wine' | 'dark-moss' | 'dark-coffee';

export type NoteFilter = 'all' | 'todos' | 'archived' | 'trashed';

export type SortBy = 'updated_at' | 'created_at' | 'title';
export type SortDirection = 'asc' | 'desc';
