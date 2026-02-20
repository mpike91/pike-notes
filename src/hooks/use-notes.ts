'use client';

import { useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotesStore } from '@/stores/notes-store';
import type { Note, NoteInsert, NoteUpdate } from '@/types';

export function useNotes() {
  const store = useNotesStore();

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const currentState = useNotesStore.getState();
    // Only show loading skeleton on first load; subsequent fetches refresh silently
    if (currentState.notes.length === 0) {
      currentState.setIsLoading(true);
    }

    let query = supabase
      .from('notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false });

    const filter = currentState.filter;
    switch (filter) {
      case 'all':
        query = query.eq('is_trashed', false).eq('is_archived', false);
        break;
      case 'todos':
        query = query.eq('is_trashed', false).eq('is_archived', false).eq('note_type', 'todo');
        break;
      case 'archived':
        query = query.eq('is_archived', true).eq('is_trashed', false);
        break;
      case 'trashed':
        query = query.eq('is_trashed', true);
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      useNotesStore.getState().setNotes(data || []);
    }
    useNotesStore.getState().setIsLoading(false);
  }, []);

  const createNote = useCallback(async (noteType: 'note' | 'todo' = 'note'): Promise<Note | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const newNote: NoteInsert = {
      user_id: user.id,
      title: '',
      content: '',
      note_type: noteType,
      sort_order: Date.now(),
    };

    const { data, error } = await supabase
      .from('notes')
      .insert(newNote)
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    store.addNote(data);
    return data;
  }, []);

  const updateNote = useCallback(async (id: string, updates: NoteUpdate) => {
    const supabase = createClient();
    store.setSaveStatus('saving');

    // Optimistic update
    store.updateNote(id, updates as Partial<Note>);

    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating note:', error);
      store.setSaveStatus('error');
      // Refetch to revert optimistic update
      await fetchNotes();
    } else {
      store.setSaveStatus('saved');
      // Reset save status after a delay
      setTimeout(() => store.setSaveStatus('idle'), 2000);
    }
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const supabase = createClient();
    store.removeNote(id);

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      await fetchNotes();
    }
  }, [fetchNotes]);

  // SAFETY: Permanently delete a note ONLY if both title and content are empty.
  // This prevents cluttering trash/archive with blank notes the user never used.
  // The check is intentionally strict: both fields must be whitespace-only strings.
  // A note with ANY non-whitespace character in either field follows normal flow.
  const isNoteEmpty = (note: Note): boolean =>
    note.title.trim() === '' && note.content.trim() === '';

  const trashNote = useCallback(async (id: string) => {
    const note = useNotesStore.getState().notes.find((n) => n.id === id);
    if (note && isNoteEmpty(note)) {
      await deleteNote(id);
      return;
    }
    await updateNote(id, { is_trashed: true });
  }, [updateNote, deleteNote]);

  const restoreNote = useCallback(async (id: string) => {
    await updateNote(id, { is_trashed: false, is_archived: false });
  }, [updateNote]);

  const archiveNote = useCallback(async (id: string) => {
    const note = useNotesStore.getState().notes.find((n) => n.id === id);
    if (note && isNoteEmpty(note)) {
      await deleteNote(id);
      return;
    }
    await updateNote(id, { is_archived: true });
  }, [updateNote, deleteNote]);

  const unarchiveNote = useCallback(async (id: string) => {
    await updateNote(id, { is_archived: false });
  }, [updateNote]);

  const pinNote = useCallback(async (id: string) => {
    const note = store.notes.find((n) => n.id === id);
    if (note) {
      await updateNote(id, { is_pinned: !note.is_pinned });
    }
  }, [updateNote, store.notes]);

  const reorderPinnedNotes = useCallback(async (orderedIds: string[]) => {
    const supabase = createClient();

    // Assign sequential sort_order values
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: (index + 1) * 1000,
    }));

    // Optimistic update
    for (const { id, sort_order } of updates) {
      store.updateNote(id, { sort_order } as Partial<Note>);
    }

    // Batch update to Supabase
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from('notes').update({ sort_order }).eq('id', id)
      )
    );
  }, []);

  const duplicateNote = useCallback(async (id: string) => {
    const note = store.notes.find((n) => n.id === id);
    if (!note) return null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const newNote: NoteInsert = {
      user_id: user.id,
      title: note.title ? `${note.title} (copy)` : '',
      content: note.content,
      note_type: note.note_type,
      sort_order: Date.now(),
    };

    const { data, error } = await supabase
      .from('notes')
      .insert(newNote)
      .select()
      .single();

    if (error) {
      console.error('Error duplicating note:', error);
      return null;
    }

    store.addNote(data);
    return data;
  }, [store.notes]);

  return {
    notes: store.notes,
    isLoading: store.isLoading,
    saveStatus: store.saveStatus,
    currentNoteId: store.currentNoteId,
    filter: store.filter,
    setFilter: store.setFilter,
    setCurrentNoteId: store.setCurrentNoteId,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    trashNote,
    restoreNote,
    archiveNote,
    unarchiveNote,
    pinNote,
    duplicateNote,
    reorderPinnedNotes,
  };
}
