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

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleNewNote = useCallback(async () => {
    const note = await createNote();
    if (note) {
      router.push(`/notes/${note.id}`);
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
        title="All Notes"
        actions={
          <button
            onClick={handleNewNote}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            New Note
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {!isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg className="h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-text-primary">No notes yet</h2>
            <p className="mt-1 text-sm text-text-muted">Press Ctrl+N or click "New Note" to get started.</p>
          </div>
        ) : (
          <NotesList notes={notes} isLoading={isLoading} />
        )}
      </div>
    </>
  );
}
