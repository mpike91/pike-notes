'use client';

import { Suspense, useEffect, useLayoutEffect, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { NotesList } from '@/components/notes/NotesList';
import { SubfolderNotes } from '@/components/folders/SubfolderNotes';
import { MobileHome, folderRow } from '@/components/folders/MobileHome';
import { MobileFolderRows } from '@/components/folders/MobileFolderRows';
import { useNotes } from '@/hooks/use-notes';
import { useGlobalShortcuts, useShortcutListener } from '@/hooks/use-shortcuts';
import { useUIStore } from '@/stores/ui-store';
import { useNotesStore } from '@/stores/notes-store';
import { useFoldersStore } from '@/stores/folders-store';
import { getDescendantIds } from '@/lib/folder-utils';
import { notesHref, parseNotesView } from '@/lib/notes-view';
import { cn } from '@/lib/utils';
import type { SortBy } from '@/types';

const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

// useSearchParams needs a Suspense boundary for Next's static prerender.
export default function NotesPage() {
  return (
    <Suspense>
      <NotesScreen />
    </Suspense>
  );
}

function NotesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const { notes, isLoading, fetchNotes, createNote } = useNotes();
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const sortBy = useNotesStore((s) => s.sortBy);
  const sortDirection = useNotesStore((s) => s.sortDirection);
  const setSortBy = useNotesStore((s) => s.setSortBy);
  const setSortDirection = useNotesStore((s) => s.setSortDirection);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const showUnfiled = useFoldersStore((s) => s.showUnfiled);
  const showAllNotes = useFoldersStore((s) => s.showAllNotes);
  const applyView = useFoldersStore((s) => s.applyView);
  const folders = useFoldersStore((s) => s.folders);
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const atHome = !selectedFolderId && !showUnfiled && !showAllNotes;

  // Mobile reads the list from the URL so Android's back gesture steps back up through folders.
  // Desktop keeps sidebar-driven store state and ignores the query.
  useLayoutEffect(() => {
    if (isMobile()) applyView(parseNotesView(new URLSearchParams(searchKey)));
  }, [searchKey, applyView]);

  const handleUp = useCallback(() => {
    if (new URLSearchParams(searchKey).get('nav') === '1') {
      router.back();
      return;
    }
    const parentId = selectedFolder?.parent_id;
    router.replace(notesHref(parentId ? { kind: 'folder', id: parentId } : { kind: 'home' }));
  }, [searchKey, selectedFolder, router]);

  const childFolderRows = useMemo(() => {
    if (!selectedFolderId) return [];
    return folders
      .filter((f) => f.parent_id === selectedFolderId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((f) => folderRow(f, notes, folders));
  }, [folders, notes, selectedFolderId]);

  const [showSubfolders, setShowSubfolders] = useState(false);

  // Reset sub-folder expansion when folder changes
  useEffect(() => {
    setShowSubfolders(false);
  }, [selectedFolderId]);

  const filteredNotes = useMemo(() => {
    if (showUnfiled) return notes.filter((n) => !n.folder_id);
    if (selectedFolderId) return notes.filter((n) => n.folder_id === selectedFolderId);
    return notes;
  }, [notes, selectedFolderId, showUnfiled]);

  // Check if selected folder has descendant folders
  const descendantFolderIds = useMemo(() => {
    if (!selectedFolderId) return [];
    return getDescendantIds(folders, selectedFolderId);
  }, [folders, selectedFolderId]);

  const hasSubfolders = descendantFolderIds.length > 0;

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleNewNote = useCallback(async () => {
    const folderId = useFoldersStore.getState().selectedFolderId;
    const note = await createNote('note', folderId);
    if (note) {
      router.push(`/notes/${note.id}?new=1`);
    }
  }, [createNote, router]);

  const shortcuts = useMemo(() => [
    { key: 'n', ctrl: true, action: handleNewNote },
    { key: 'f', ctrl: true, shift: true, action: toggleFocusMode },
  ], [handleNewNote, toggleFocusMode]);

  useGlobalShortcuts(shortcuts);
  useShortcutListener();

  return (
    <>
      <AppHeader
        title={selectedFolder ? selectedFolder.name : showUnfiled ? 'Unfiled' : showAllNotes ? 'All notes' : 'Notes'}
        onBack={atHome ? undefined : handleUp}
        actions={
          <>
            <div className={cn('flex items-center gap-2', atHome && 'hidden md:flex')}>
            {/* Sort controls */}
            <button
              onClick={() => {
                const next: Record<SortBy, SortBy> = { updated_at: 'title', title: 'custom', custom: 'updated_at', created_at: 'updated_at' };
                setSortBy(next[sortBy]);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
              title={`Sort by ${sortBy === 'updated_at' ? 'title' : sortBy === 'title' ? 'custom order' : 'date edited'}`}
            >
              {sortBy === 'updated_at' ? 'Date' : sortBy === 'title' ? 'A\u2013Z' : 'Custom'}
            </button>
            {sortBy !== 'custom' && (
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {sortDirection === 'asc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  )}
                </svg>
              </button>
            )}
            </div>

            <button
              onClick={handleNewNote}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New
            </button>
          </>
        }
      />
      {atHome && (
        <div className="md:hidden flex-1 overflow-y-auto">
          <MobileHome />
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto', atHome && 'hidden md:block')}>
        {childFolderRows.length > 0 && (
          <div className="md:hidden pt-3">
            <MobileFolderRows items={childFolderRows} />
          </div>
        )}
        {!isLoading && filteredNotes.length === 0 ? (
          <div className={cn(
            'flex-col items-center justify-center py-24 text-center px-4',
            childFolderRows.length > 0 ? 'hidden md:flex' : 'flex'
          )}>
            <svg className="h-10 w-10 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="mt-4 text-sm text-text-muted">{selectedFolderId ? 'No notes in this folder' : showUnfiled ? 'No unfiled notes' : 'No notes yet'}</p>
            <p className="mt-1 text-xs text-text-muted/70">Tap + New to get started</p>
          </div>
        ) : (
          <NotesList notes={filteredNotes} isLoading={isLoading} />
        )}
        {/* Mobile lists subfolders as rows above, so this grouped view is desktop-only. */}
        {selectedFolderId && hasSubfolders && (
          <div className="hidden md:block">
          <SubfolderNotes
            notes={notes}
            folders={folders}
            parentFolderId={selectedFolderId}
            descendantFolderIds={descendantFolderIds}
            showSubfolders={showSubfolders}
            onToggle={() => setShowSubfolders((v) => !v)}
          />
          </div>
        )}
      </div>
    </>
  );
}
