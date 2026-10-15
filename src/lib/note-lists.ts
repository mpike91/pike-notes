import type { Folder, Note } from '@/types';
import { getDescendantIds } from '@/lib/folder-utils';

/** Pinned notes for quick access, in the user's custom pinned order. */
export function getPinnedNotes(notes: Note[]): Note[] {
  return notes
    .filter((n) => n.is_pinned && !n.is_archived && !n.is_trashed)
    .sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER));
}

/** Most recently edited notes that aren't already pinned. */
export function getRecentNotes(notes: Note[], limit: number): Note[] {
  return notes
    .filter((n) => !n.is_pinned && !n.is_archived && !n.is_trashed)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}

/** Live notes in a folder, including everything in its subfolders. */
export function countNotesInFolder(notes: Note[], folders: Folder[], folderId: string): number {
  const ids = new Set([folderId, ...getDescendantIds(folders, folderId)]);
  return notes.filter((n) => n.folder_id && ids.has(n.folder_id) && !n.is_archived && !n.is_trashed).length;
}
