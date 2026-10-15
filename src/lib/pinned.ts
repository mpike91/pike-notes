import type { Note } from '@/types';

/** Pinned notes for quick access, in the user's custom pinned order. */
export function getPinnedNotes(notes: Note[]): Note[] {
  return notes
    .filter((n) => n.is_pinned && !n.is_archived && !n.is_trashed)
    .sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER));
}
