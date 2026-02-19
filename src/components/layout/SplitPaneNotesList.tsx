'use client';

import { useEffect } from 'react';
import { NotesList } from '@/components/notes/NotesList';
import { useNotes } from '@/hooks/use-notes';
import type { Note } from '@/types';

interface SplitPaneNotesListProps {
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
}

export function SplitPaneNotesList({ onNoteSelect, onNewNote }: SplitPaneNotesListProps) {
  const { notes, isLoading, fetchNotes } = useNotes();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-bg-primary">
        <h2 className="text-sm font-semibold text-text-primary">Notes</h2>
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-sm text-text-muted">No notes yet</p>
          </div>
        ) : (
          <NotesList notes={notes} isLoading={isLoading} onNoteClick={onNoteSelect} />
        )}
      </div>
    </div>
  );
}
