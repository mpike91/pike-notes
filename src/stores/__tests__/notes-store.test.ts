import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Note, TodoItem } from '@/types';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

const { useNotesStore } = await import('@/stores/notes-store');

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    user_id: 'user1',
    title: 'Test Note',
    content: '',
    note_type: 'note',
    is_pinned: false,
    is_archived: false,
    is_trashed: false,
    trashed_at: null,
    color: 'default',
    sort_order: 0,
    folder_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeTodo(overrides: Partial<TodoItem> & { id: string; note_id: string }): TodoItem {
  return {
    user_id: 'user1',
    content: 'Test todo',
    is_completed: false,
    completed_at: null,
    priority: 0,
    sort_order: 0,
    due_at: null,
    reminder_at: null,
    snooze_until: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  useNotesStore.setState({
    notes: [],
    todoItems: {},
    currentNoteId: null,
    filter: 'all',
    sortBy: 'updated_at',
    sortDirection: 'desc',
    isLoading: true,
    saveStatus: 'idle',
  });
});

describe('setNotes / addNote / removeNote', () => {
  it('sets notes list', () => {
    const notes = [makeNote({ id: 'a' }), makeNote({ id: 'b' })];
    useNotesStore.getState().setNotes(notes);
    expect(useNotesStore.getState().notes).toEqual(notes);
  });

  it('addNote prepends', () => {
    useNotesStore.getState().setNotes([makeNote({ id: 'a' })]);
    useNotesStore.getState().addNote(makeNote({ id: 'b' }));
    expect(useNotesStore.getState().notes[0].id).toBe('b');
  });

  it('addNote prevents duplicates', () => {
    useNotesStore.getState().addNote(makeNote({ id: 'a' }));
    useNotesStore.getState().addNote(makeNote({ id: 'a' }));
    expect(useNotesStore.getState().notes).toHaveLength(1);
  });

  it('removeNote removes by id', () => {
    useNotesStore.getState().setNotes([makeNote({ id: 'a' }), makeNote({ id: 'b' })]);
    useNotesStore.getState().removeNote('a');
    expect(useNotesStore.getState().notes.map((n) => n.id)).toEqual(['b']);
  });
});

describe('updateNote', () => {
  it('merges partial updates', () => {
    useNotesStore.getState().setNotes([makeNote({ id: 'a', title: 'Old' })]);
    useNotesStore.getState().updateNote('a', { title: 'New' });
    const note = useNotesStore.getState().notes[0];
    expect(note.title).toBe('New');
    expect(note.content).toBe('');
  });
});

describe('setFilter / setSortBy / setSortDirection', () => {
  it('sets filter', () => {
    useNotesStore.getState().setFilter('todos');
    expect(useNotesStore.getState().filter).toBe('todos');
  });

  it('sets sortBy', () => {
    useNotesStore.getState().setSortBy('title');
    expect(useNotesStore.getState().sortBy).toBe('title');
  });

  it('sets sortDirection', () => {
    useNotesStore.getState().setSortDirection('asc');
    expect(useNotesStore.getState().sortDirection).toBe('asc');
  });
});

describe('todoItems CRUD', () => {
  it('setTodoItems sets items for a note', () => {
    const items = [makeTodo({ id: 't1', note_id: 'n1' })];
    useNotesStore.getState().setTodoItems('n1', items);
    expect(useNotesStore.getState().todoItems['n1']).toEqual(items);
  });

  it('addTodoItem appends and prevents duplicates', () => {
    const item = makeTodo({ id: 't1', note_id: 'n1' });
    useNotesStore.getState().addTodoItem(item);
    useNotesStore.getState().addTodoItem(item);
    expect(useNotesStore.getState().todoItems['n1']).toHaveLength(1);
  });

  it('updateTodoItem merges updates', () => {
    useNotesStore.getState().setTodoItems('n1', [makeTodo({ id: 't1', note_id: 'n1', content: 'Old' })]);
    useNotesStore.getState().updateTodoItem('t1', 'n1', { content: 'New' });
    expect(useNotesStore.getState().todoItems['n1'][0].content).toBe('New');
  });

  it('removeTodoItem removes by id', () => {
    useNotesStore.getState().setTodoItems('n1', [
      makeTodo({ id: 't1', note_id: 'n1' }),
      makeTodo({ id: 't2', note_id: 'n1' }),
    ]);
    useNotesStore.getState().removeTodoItem('t1', 'n1');
    expect(useNotesStore.getState().todoItems['n1'].map((t) => t.id)).toEqual(['t2']);
  });
});
