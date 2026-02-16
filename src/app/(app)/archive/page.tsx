'use client';

import { useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { NotesList } from '@/components/notes/NotesList';
import { useNotes } from '@/hooks/use-notes';

export default function ArchivePage() {
  const { notes, isLoading, fetchNotes, setFilter } = useNotes();

  useEffect(() => {
    setFilter('archived');
    fetchNotes();
    return () => setFilter('all');
  }, [setFilter, fetchNotes]);

  return (
    <>
      <AppHeader title="Archive" />
      <div className="flex-1 overflow-y-auto">
        {!isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg className="h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-text-primary">Archive is empty</h2>
            <p className="mt-1 text-sm text-text-muted">Notes you archive will appear here.</p>
          </div>
        ) : (
          <NotesList notes={notes} isLoading={isLoading} />
        )}
      </div>
    </>
  );
}
