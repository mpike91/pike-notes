'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotesStore } from '@/stores/notes-store';
import { flushOfflineQueue } from '@/lib/sync/engine';
import type { Note, TodoItem } from '@/types';
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
            const old = payload.old as { id: string; note_id: string };
            state.removeTodoItem(old.id, old.note_id);
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

export function useOfflineSync() {
  useEffect(() => {
    function handleOnline() {
      flushOfflineQueue();
    }

    window.addEventListener('online', handleOnline);

    // Flush queue on mount if already online
    if (navigator.onLine) {
      flushOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
