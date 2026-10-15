import { describe, it, expect } from 'vitest';
import { notesHref, parseNotesView, viewFromState } from '@/lib/notes-view';

describe('notes view URLs', () => {
  it('round-trips every view through its URL', () => {
    for (const view of [
      { kind: 'home' },
      { kind: 'all' },
      { kind: 'unfiled' },
      { kind: 'folder', id: 'abc' },
    ] as const) {
      const href = notesHref(view);
      expect(parseNotesView(new URL(href, 'http://x').searchParams)).toEqual(view);
    }
  });

  it('marks in-app drill-downs so the back arrow can pop history', () => {
    expect(notesHref({ kind: 'folder', id: 'abc' }, { drill: true })).toBe('/notes?folder=abc&nav=1');
  });

  it('treats a bare /notes as home', () => {
    expect(notesHref({ kind: 'home' })).toBe('/notes');
    expect(parseNotesView(new URLSearchParams())).toEqual({ kind: 'home' });
  });
});

describe('viewFromState', () => {
  it('maps folder-store state to a view', () => {
    expect(viewFromState({ selectedFolderId: 'f', showUnfiled: false, showAllNotes: false })).toEqual({ kind: 'folder', id: 'f' });
    expect(viewFromState({ selectedFolderId: null, showUnfiled: true, showAllNotes: false })).toEqual({ kind: 'unfiled' });
    expect(viewFromState({ selectedFolderId: null, showUnfiled: false, showAllNotes: true })).toEqual({ kind: 'all' });
    expect(viewFromState({ selectedFolderId: null, showUnfiled: false, showAllNotes: false })).toEqual({ kind: 'home' });
  });
});
