'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { NotesList } from '@/components/notes/NotesList';
import { useNotes } from '@/hooks/use-notes';

export default function TodosPage() {
  const router = useRouter();
  const { notes, isLoading, fetchNotes, setFilter, createNote } = useNotes();

  useEffect(() => {
    setFilter('todos');
    fetchNotes();
    return () => setFilter('all');
  }, [setFilter, fetchNotes]);

  const handleNewTodo = async () => {
    const note = await createNote('todo');
    if (note) router.push(`/notes/${note.id}`);
  };

  return (
    <>
      <AppHeader
        title="Todos"
        actions={
          <button
            onClick={handleNewTodo}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            New Todo
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {!isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg className="h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-text-primary">No todos yet</h2>
            <p className="mt-1 text-sm text-text-muted">Create a todo note to track your tasks.</p>
          </div>
        ) : (
          <NotesList notes={notes} isLoading={isLoading} />
        )}
      </div>
    </>
  );
}
