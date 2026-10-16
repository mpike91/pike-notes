'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotesStore } from '@/stores/notes-store';
import { useFoldersStore } from '@/stores/folders-store';
import { flushOfflineQueue } from '@/lib/sync/engine';
import type { Note, TodoItem, Folder } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useSync() {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to realtime changes on notes
    const channel = supabase
      .channel('pike-notes-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          // Use getState() to read current store (not stale closure)
          const state = useNotesStore.getState();
          if (payload.eventType === 'INSERT') {
            const note = payload.new as Note;
            const exists = state.notes.some((n) => n.id === note.id);
            if (!exists) {
              state.addNote(note);
            }
          } else if (payload.eventType === 'UPDATE') {
            const note = payload.new as Note;
            state.updateNote(note.id, note);
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            state.removeNote(old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_items' },
        (payload) => {
          const state = useNotesStore.getState();
          if (payload.eventType === 'INSERT') {
            const item = payload.new as TodoItem;
            const existing = state.todoItems[item.note_id] || [];
            if (!existing.some((t) => t.id === item.id)) {
              state.addTodoItem(item);
            }
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new as TodoItem;
            state.updateTodoItem(item.id, item.note_id, item);
          } else if (payload.eventType === 'DELETE') {
            // Delete payloads carry only the primary key, so find the item's note locally.
            const { id } = payload.old as { id: string };
            const noteId = Object.keys(state.todoItems).find((nid) => state.todoItems[nid].some((t) => t.id === id));
            if (noteId) state.removeTodoItem(id, noteId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders' },
        (payload) => {
          const fState = useFoldersStore.getState();
          if (payload.eventType === 'INSERT') {
            const folder = payload.new as Folder;
            if (!fState.folders.some((f) => f.id === folder.id)) {
              fState.addFolder(folder);
            }
          } else if (payload.eventType === 'UPDATE') {
            const folder = payload.new as Folder;
            fState.updateFolder(folder.id, folder);
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            fState.removeFolderAndDescendants(old.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, []);

  return null;
}

/** Flushes queued offline writes on reconnect, then lets the caller refetch. */
export function useOfflineSync(onFlushed?: () => void) {
  useEffect(() => {
    async function handleOnline() {
      await flushOfflineQueue();
      onFlushed?.();
    }

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [onFlushed]);
}
