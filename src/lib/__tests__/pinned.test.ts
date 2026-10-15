import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { getPinnedNotes } from '@/lib/pinned';

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
