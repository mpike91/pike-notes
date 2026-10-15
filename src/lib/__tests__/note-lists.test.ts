import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { getPinnedNotes, getRecentNotes, countNotesInFolder } from '@/lib/note-lists';
import type { Folder } from '@/types';

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    user_id: 'user1',
    title: '',
    content: '',
    note_type: 'note',
    is_pinned: false,
    is_archived: false,
    is_trashed: false,
    trashed_at: null,
    color: 'default',
    sort_order: null,
    folder_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as Note;
}

describe('getPinnedNotes', () => {
  it('returns only pinned notes in pinned order', () => {
    const notes = [
      makeNote({ id: 'a', is_pinned: true, sort_order: 2 }),
      makeNote({ id: 'b' }),
      makeNote({ id: 'c', is_pinned: true, sort_order: 1 }),
    ];
    expect(getPinnedNotes(notes).map((n) => n.id)).toEqual(['c', 'a']);
  });

  it('hides pinned notes that were archived or trashed', () => {
    const notes = [
      makeNote({ id: 'a', is_pinned: true, is_archived: true }),
      makeNote({ id: 'b', is_pinned: true, is_trashed: true }),
    ];
    expect(getPinnedNotes(notes)).toEqual([]);
  });

  it('puts never-reordered pins after ordered ones', () => {
    const notes = [
      makeNote({ id: 'a', is_pinned: true }),
      makeNote({ id: 'b', is_pinned: true, sort_order: 5 }),
    ];
    expect(getPinnedNotes(notes).map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('getRecentNotes', () => {
  it('returns the most recently edited unpinned notes, newest first', () => {
    const notes = [
      makeNote({ id: 'old', updated_at: '2024-01-01T00:00:00Z' }),
      makeNote({ id: 'new', updated_at: '2024-03-01T00:00:00Z' }),
      makeNote({ id: 'pinned', is_pinned: true, updated_at: '2024-04-01T00:00:00Z' }),
      makeNote({ id: 'mid', updated_at: '2024-02-01T00:00:00Z' }),
    ];
    expect(getRecentNotes(notes, 2).map((n) => n.id)).toEqual(['new', 'mid']);
  });

  it('skips archived and trashed notes', () => {
    const notes = [makeNote({ id: 'a', is_archived: true }), makeNote({ id: 'b', is_trashed: true })];
    expect(getRecentNotes(notes, 5)).toEqual([]);
  });
});

describe('countNotesInFolder', () => {
  const folder = (id: string, parent_id: string | null) =>
    ({ id, parent_id, name: id, user_id: 'u', sort_order: 0, created_at: '', updated_at: '' }) as Folder;
  const folders = [folder('personal', null), folder('bible', 'personal'), folder('other', null)];

  it('counts notes in the folder and all of its subfolders', () => {
    const notes = [
      makeNote({ id: '1', folder_id: 'personal' }),
      makeNote({ id: '2', folder_id: 'bible' }),
      makeNote({ id: '3', folder_id: 'other' }),
      makeNote({ id: '4', folder_id: 'bible', is_trashed: true }),
    ];
    expect(countNotesInFolder(notes, folders, 'personal')).toBe(2);
  });
});
