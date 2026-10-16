'use client';

import { useCallback, useEffect, useRef } from 'react';
import { DraftSaver, saveDraft, type Draft, type SavedNote } from '@/lib/sync/draft';
import { supabaseDraftBackend } from '@/lib/sync/note-backend';
import { useNotesStore } from '@/stores/notes-store';
import type { Note } from '@/types';

interface Session {
  id: string;
  base: SavedNote;
  draft: Draft;
  saver: DraftSaver;
}

interface Handlers {
  /** A newer version arrived from another device while nothing was pending here. */
  onRemoteChange: (draft: Draft) => void;
  /** Both this device and another edited the text; the server copy wins in the editor. */
  onConflict: (local: Draft, server: SavedNote) => void;
}

const isNewer = (a: string, b: string) => Date.parse(a) > Date.parse(b);

/**
 * Autosaves one open note: debounced, saved immediately on leave/hide, guarded against
 * overwriting edits from other devices. One session per note id, so a save that finishes
 * after switching notes still writes to the note it came from.
 */
export function useNoteAutosave(note: Note | null, handlers: Handlers) {
  const sessionRef = useRef<Session | null>(null);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const noteId = note?.id ?? null;

  useEffect(() => {
    if (!note) return;
    const backend = supabaseDraftBackend();
    const { setSaveStatus, updateNote } = useNotesStore.getState();
    const session: Session = {
      id: note.id,
      base: { title: note.title ?? '', content: note.content ?? '', updatedAt: note.updated_at },
      draft: { title: note.title ?? '', content: note.content ?? '' },
      saver: new DraftSaver(async () => {
        const draft = session.draft;
        setSaveStatus('saving');
        updateNote(session.id, draft);
        try {
          const outcome = await saveDraft(backend, session.id, draft, session.base);
          if (outcome.kind === 'conflict') {
            session.base = outcome.server;
            session.draft = { title: outcome.server.title, content: outcome.server.content };
            updateNote(session.id, { ...session.draft, updated_at: outcome.server.updatedAt });
            setSaveStatus('idle');
            if (sessionRef.current === session) handlersRef.current.onConflict(draft, outcome.server);
            return;
          }
          session.base = outcome.base;
          if (outcome.kind === 'saved') updateNote(session.id, { updated_at: outcome.base.updatedAt });
          setSaveStatus(outcome.kind === 'queued' ? 'offline' : 'saved');
          if (outcome.kind === 'saved') setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          setSaveStatus('error');
          throw err;
        }
      }),
    };
    sessionRef.current = session;

    const unsubscribe = useNotesStore.subscribe((state) => {
      if (session.saver.busy) return;
      const latest = state.notes.find((n) => n.id === session.id);
      // Older copies come from cached refetches while offline; never let them replace newer text.
      if (!latest || !isNewer(latest.updated_at, session.base.updatedAt)) return;
      const remote = { title: latest.title ?? '', content: latest.content ?? '' };
      session.base = { ...remote, updatedAt: latest.updated_at };
      if (remote.title === session.draft.title && remote.content === session.draft.content) return;
      session.draft = remote;
      if (sessionRef.current === session) handlersRef.current.onRemoteChange(remote);
    });

    return () => {
      unsubscribe();
      void session.saver.flush();
      if (sessionRef.current === session) sessionRef.current = null;
    };
    // A session lives for one note id; later changes to `note` are metadata (pin, folder).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    const flushNow = () => void sessionRef.current?.saver.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const change = useCallback((changes: Partial<Draft>) => {
    const session = sessionRef.current;
    if (!session) return;
    session.draft = { ...session.draft, ...changes };
    session.saver.markDirty();
  }, []);

  /** Saves anything pending now; await it before acting on the saved text (archive, trash). */
  const flush = useCallback(() => sessionRef.current?.saver.flush() ?? Promise.resolve(), []);

  const saveNow = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return Promise.resolve();
    session.saver.markDirty();
    return session.saver.flush();
  }, []);

  return { change, flush, saveNow };
}
