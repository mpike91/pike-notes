'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useNotesStore } from '@/stores/notes-store';
import { useFoldersStore } from '@/stores/folders-store';
import { useFolders } from '@/hooks/use-folders';
import { getPinnedNotes, getRecentNotes, countNotesInFolder } from '@/lib/note-lists';
import { getFolderPath } from '@/lib/folder-utils';
import { notesHref } from '@/lib/notes-view';
import { formatDate } from '@/lib/utils';
import { MobileFolderRows, SectionLabel, NotesIcon, type FolderRowItem } from './MobileFolderRows';
import type { Folder, Note } from '@/types';

const RECENT_LIMIT = 3;

/** Mobile Notes tab landing screen: Pinned, Recent, then folders. */
export function MobileHome() {
  const notes = useNotesStore((s) => s.notes);
  const folders = useFoldersStore((s) => s.folders);
  const { createFolder } = useFolders();

  const pinned = useMemo(() => getPinnedNotes(notes), [notes]);
  const recent = useMemo(() => getRecentNotes(notes, RECENT_LIMIT), [notes]);
  const folderRows = useMemo(() => buildHomeRows(notes, folders), [notes, folders]);

  return (
    <div className="pb-6">
      {pinned.length > 0 && (
        <>
          <SectionLabel>Pinned</SectionLabel>
          <NoteRows notes={pinned} folders={folders} />
        </>
      )}
      {recent.length > 0 && (
        <>
          <SectionLabel>Recent</SectionLabel>
          <NoteRows notes={recent} folders={folders} />
        </>
      )}
      <SectionLabel
        action={
          <button onClick={() => createFolder(null)} className="rounded p-1 text-text-muted hover:text-text-secondary" aria-label="New folder">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        }
      >
        Folders
      </SectionLabel>
      <MobileFolderRows items={folderRows} />
    </div>
  );
}

function buildHomeRows(notes: Note[], folders: Folder[]): FolderRowItem[] {
  const live = notes.filter((n) => !n.is_archived && !n.is_trashed);
  const topLevel = folders
    .filter((f) => !f.parent_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return [
    { key: 'all', label: 'All notes', icon: 'notes', count: live.length, href: notesHref({ kind: 'all' }, { drill: true }) },
    { key: 'unfiled', label: 'Unfiled', icon: 'folder', count: live.filter((n) => !n.folder_id).length, href: notesHref({ kind: 'unfiled' }, { drill: true }) },
    ...topLevel.map((f) => folderRow(f, notes, folders)),
  ];
}

export function folderRow(folder: Folder, notes: Note[], folders: Folder[]): FolderRowItem {
  const children = folders.filter((f) => f.parent_id === folder.id).length;
  return {
    key: folder.id,
    folderId: folder.id,
    label: folder.name,
    icon: 'folder',
    count: countNotesInFolder(notes, folders, folder.id),
    detail: children > 0 ? `${children} folder${children === 1 ? '' : 's'}` : undefined,
    href: notesHref({ kind: 'folder', id: folder.id }, { drill: true }),
  };
}

function NoteRows({ notes, folders }: { notes: Note[]; folders: Folder[] }) {
  return (
    <div className="mx-2 rounded-lg bg-bg-secondary divide-y divide-border overflow-hidden">
      {notes.map((note) => {
        const where = note.folder_id
          ? getFolderPath(folders, note.folder_id).map((f) => f.name).join(' › ')
          : 'Unfiled';
        return (
          <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center gap-3 px-3 py-2.5 active:bg-bg-tertiary transition-colors">
            <NotesIcon className="h-5 w-5 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium text-text-primary">{note.title || 'Untitled'}</div>
              <div className="truncate text-xs text-text-muted">{where} · {formatDate(note.updated_at)}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
