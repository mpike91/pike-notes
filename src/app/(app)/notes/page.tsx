'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { NotesList } from '@/components/notes/NotesList';
import { useNotes } from '@/hooks/use-notes';
import { useGlobalShortcuts, useShortcutListener } from '@/hooks/use-shortcuts';
import { useUIStore } from '@/stores/ui-store';

export default function NotesPage() {
  const router = useRouter();
  const { notes, isLoading, fetchNotes, createNote } = useNotes();
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const toggleSplitView = useUIStore((s) => s.toggleSplitView);
  const splitViewActive = useUIStore((s) => s.splitViewActive);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleNewNote = useCallback(async () => {
    const note = await createNote();
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
        title="Notes"
        actions={
          <>
            <button
              onClick={() => toggleSplitView(null)}
              className={`hidden md:inline-flex rounded-md p-1.5 transition-colors ${
                splitViewActive
                  ? 'text-accent bg-accent/10'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary'
              }`}
              aria-label="Toggle split view"
              title="Split view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </button>
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
      <div className="flex-1 overflow-y-auto">
        {!isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <svg className="h-10 w-10 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="mt-4 text-sm text-text-muted">No notes yet</p>
            <p className="mt-1 text-xs text-text-muted/70">Press Ctrl+N to get started</p>
          </div>
        ) : (
          <NotesList notes={notes} isLoading={isLoading} />
        )}
      </div>
    </>
  );
}
