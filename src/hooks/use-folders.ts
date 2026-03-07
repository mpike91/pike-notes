'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFoldersStore } from '@/stores/folders-store';
import { useNotesStore } from '@/stores/notes-store';
import { isDescendant, getFolderDepth, getMaxDescendantDepth, MAX_FOLDER_DEPTH } from '@/lib/folder-utils';
import type { Folder, FolderInsert } from '@/types';

export function useFolders() {
  const store = useFoldersStore();

  const fetchFolders = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching folders:', error);
    } else {
      useFoldersStore.getState().setFolders(data || []);
    }
  }, []);

  const createFolder = useCallback(async (parentId?: string | null): Promise<Folder | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check depth limit
    if (parentId) {
      const folders = useFoldersStore.getState().folders;
      const parentDepth = getFolderDepth(folders, parentId);
      if (parentDepth + 1 >= MAX_FOLDER_DEPTH) return null;
    }

    const newFolder: FolderInsert = {
      user_id: user.id,
      parent_id: parentId || null,
      name: 'New Folder',
      sort_order: Date.now(),
    };

    const { data, error } = await supabase
      .from('folders')
      .insert(newFolder)
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return null;
    }

    store.addFolder(data);

    // Auto-expand parent
    if (parentId) {
      store.expandFolder(parentId);
    }

    return data;
  }, []);

  const renameFolder = useCallback(async (id: string, name: string) => {
    const supabase = createClient();
    store.updateFolder(id, { name });

    const { error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error renaming folder:', error);
      await fetchFolders();
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    const supabase = createClient();

    // Optimistic: remove folder and descendants from store
    store.removeFolderAndDescendants(id);

    // Also clear folder_id on notes that belong to deleted folders
    const notesState = useNotesStore.getState();
    for (const note of notesState.notes) {
      if (note.folder_id === id) {
        notesState.updateNote(note.id, { folder_id: null });
      }
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting folder:', error);
      await fetchFolders();
    }
  }, [fetchFolders]);

  const moveFolder = useCallback(async (id: string, newParentId: string | null) => {
    const folders = useFoldersStore.getState().folders;

    // Prevent moving to self
    if (id === newParentId) return;

    // Prevent cycles
    if (newParentId && isDescendant(folders, id, newParentId)) return;

    // Check depth limit
    if (newParentId) {
      const targetDepth = getFolderDepth(folders, newParentId) + 1;
      const subtreeDepth = getMaxDescendantDepth(folders, id);
      if (targetDepth + subtreeDepth >= MAX_FOLDER_DEPTH) return;
    }

    const supabase = createClient();
    store.updateFolder(id, { parent_id: newParentId });

    const { error } = await supabase
      .from('folders')
      .update({ parent_id: newParentId })
      .eq('id', id);

    if (error) {
      console.error('Error moving folder:', error);
      await fetchFolders();
    }
  }, [fetchFolders]);

  const reorderFolders = useCallback(async (orderedIds: string[]) => {
    const supabase = createClient();
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: (index + 1) * 1000,
    }));

    for (const { id, sort_order } of updates) {
      store.updateFolder(id, { sort_order });
    }

    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from('folders').update({ sort_order }).eq('id', id)
      )
    );
  }, []);

  const moveNoteToFolder = useCallback(async (noteId: string, folderId: string | null) => {
    const supabase = createClient();
    const notesStore = useNotesStore.getState();

    // Optimistic update
    notesStore.updateNote(noteId, { folder_id: folderId });

    const { error } = await supabase
      .from('notes')
      .update({ folder_id: folderId })
      .eq('id', noteId);

    if (error) {
      console.error('Error moving note to folder:', error);
      // Revert
      const note = notesStore.notes.find((n) => n.id === noteId);
      if (note) {
        notesStore.updateNote(noteId, { folder_id: note.folder_id });
      }
    }
  }, []);

  return {
    folders: store.folders,
    selectedFolderId: store.selectedFolderId,
    expandedFolderIds: store.expandedFolderIds,
    setSelectedFolderId: store.setSelectedFolderId,
    toggleFolderExpanded: store.toggleFolderExpanded,
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    reorderFolders,
    moveNoteToFolder,
  };
}
