'use client';

import { NoteCard } from './NoteCard';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[];
  currentNoteId?: string | null;
  isLoading?: boolean;
}

export function NotesList({ notes, currentNoteId, isLoading }: NotesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1 px-2 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg px-3.5 py-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-bg-tertiary" />
            <div className="mt-2 h-3 w-full rounded bg-bg-tertiary" />
            <div className="mt-1.5 h-2.5 w-16 rounded bg-bg-tertiary" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} isActive={note.id === currentNoteId} />
      ))}
    </div>
  );
}
