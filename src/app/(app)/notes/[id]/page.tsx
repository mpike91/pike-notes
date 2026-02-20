'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { CodeMirrorEditor } from '@/components/editor/CodeMirrorEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { FocusMode } from '@/components/editor/FocusMode';
import { useNotes } from '@/hooks/use-notes';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { useGlobalShortcuts, useShortcutListener } from '@/hooks/use-shortcuts';
import { useUIStore } from '@/stores/ui-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useNotesStore } from '@/stores/notes-store';
import type { Note } from '@/types';

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = params.id as string;
  const isNewNote = searchParams.get('new') === '1';
  const titleRef = useRef<HTMLInputElement>(null);

  // Initialize from store for instant render (lazy initializers run only on mount)
  const getStoreNote = useCallback(
    () => useNotesStore.getState().notes.find((n) => n.id === noteId) ?? null,
    [noteId]
  );
  const initialNote = useMemo(getStoreNote, [getStoreNote]);

  const [note, setNote] = useState<Note | null>(initialNote);
  const [title, setTitle] = useState(initialNote?.title ?? '');
  const [content, setContent] = useState(initialNote?.content ?? '');
  const [loading, setLoading] = useState(!initialNote);

  const saveStatus = useNotesStore((s) => s.saveStatus);
  const { updateNote, pinNote, archiveNote, unarchiveNote, trashNote, deleteNote, duplicateNote, createNote } = useNotes();
  const { tabSize, fontSize, lineHeight, contentMaxWidth, fontFamily, homeNoteId, setHomeNoteId } = useSettingsStore();
  const { focusModeActive, toggleFocusMode } = useUIStore();

  // Auto-focus title for new notes
  useEffect(() => {
    if (isNewNote && !loading && titleRef.current) {
      titleRef.current.focus();
      router.replace(`/notes/${noteId}`, { scroll: false });
    }
  }, [isNewNote, loading, noteId, router]);

  useEffect(() => {
    // Store-first: use cached note for instant switching
    const storeNote = useNotesStore.getState().notes.find((n) => n.id === noteId);
    if (storeNote) {
      setNote(storeNote);
      setTitle(storeNote.title);
      setContent(storeNote.content);
      setLoading(false);
      return;
    }

    // Fallback: fetch from Supabase (cold start, direct URL, bookmark)
    setLoading(true);
    async function fetchNote() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error || !data) {
        router.push('/notes');
        return;
      }

      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      setLoading(false);
    }

    fetchNote();
  }, [noteId, router]);

  const { debouncedFn: debouncedSave } = useDebouncedCallback(
    (updates: { title?: string; content?: string }) => {
      if (note) {
        updateNote(note.id, updates);
      }
    },
    800
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  }, [debouncedSave]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    debouncedSave({ content: newContent });
  }, [debouncedSave]);

  const handleForceSave = useCallback(() => {
    if (note) {
      updateNote(note.id, { title, content });
    }
  }, [note, title, content, updateNote]);

  const handleBack = useCallback(() => {
    router.push('/notes');
  }, [router]);

  const handleCopy = useCallback(() => {
    const text = [title, content].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [title, content]);

  const handleTrash = useCallback(async () => {
    if (note) {
      await trashNote(note.id);
      router.push('/notes');
    }
  }, [note, trashNote, router]);

  const handleDelete = useCallback(async () => {
    if (note) {
      await deleteNote(note.id);
      router.push('/notes');
    }
  }, [note, deleteNote, router]);

  const handleRestore = useCallback(async () => {
    if (note) {
      await updateNote(note.id, { is_trashed: false });
      router.push('/notes');
    }
  }, [note, updateNote, router]);

  const handleDuplicate = useCallback(async () => {
    if (note) {
      await duplicateNote(note.id);
    }
  }, [note, duplicateNote]);

  const handleArchive = useCallback(async () => {
    if (note) {
      if (note.is_archived) {
        await unarchiveNote(note.id);
      } else {
        await archiveNote(note.id);
        router.push('/notes');
      }
    }
  }, [note, archiveNote, unarchiveNote, router]);

  const handlePin = useCallback(async () => {
    if (note) {
      await pinNote(note.id);
      setNote({ ...note, is_pinned: !note.is_pinned });
    }
  }, [note, pinNote]);

  const handleSetHomeNote = useCallback(() => {
    if (note) setHomeNoteId(note.id);
  }, [note, setHomeNoteId]);

  const handleClearHomeNote = useCallback(() => {
    setHomeNoteId(null);
  }, [setHomeNoteId]);

  const handleNewNote = useCallback(async () => {
    const newNote = await createNote();
    if (newNote) router.push(`/notes/${newNote.id}?new=1`);
  }, [createNote, router]);

  const shortcuts = useMemo(() => [
    { key: 's', ctrl: true, action: handleForceSave },
    { key: 'f', ctrl: true, shift: true, action: toggleFocusMode },
    { key: 'n', ctrl: true, action: handleNewNote },
  ], [handleForceSave, toggleFocusMode, createNote, router]);

  useGlobalShortcuts(shortcuts);
  useShortcutListener();

  if (loading || !note) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="h-4 w-4 rounded bg-bg-tertiary animate-pulse" />
          <div className="h-5 w-48 rounded bg-bg-tertiary animate-pulse" />
          <div className="ml-auto h-4 w-16 rounded bg-bg-tertiary animate-pulse" />
        </div>
        <div className="flex-1 space-y-3 px-6 py-6 md:px-8">
          <div className="h-4 w-3/4 rounded bg-bg-tertiary animate-pulse" />
          <div className="h-4 w-full rounded bg-bg-tertiary animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-bg-tertiary animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-bg-tertiary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <EditorHeader
        note={note}
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        onPin={handlePin}
        onArchive={handleArchive}
        onTrash={handleTrash}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onDuplicate={handleDuplicate}
        onCopy={handleCopy}
        onBack={handleBack}
        onNewNote={handleNewNote}
        titleRef={titleRef}
        onSetHomeNote={handleSetHomeNote}
        onClearHomeNote={handleClearHomeNote}
        isHomeNote={homeNoteId === note.id}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden px-5 py-4 md:px-8">
        <CodeMirrorEditor
          value={content}
          onChange={handleContentChange}
          fontSize={fontSize}
          tabSize={tabSize}
          lineHeight={lineHeight}
          contentMaxWidth={contentMaxWidth}
          fontFamily={fontFamily}
          autoFocus={!isNewNote}
        />

        {/* Save indicator */}
        <span className={cn(
          'absolute bottom-3 left-5 md:left-8 z-10 text-[11px] select-none transition-opacity duration-300',
          saveStatus === 'idle' && 'opacity-0',
          saveStatus === 'saving' && 'text-text-muted/50 opacity-100',
          saveStatus === 'saved' && 'text-text-muted/50 opacity-100',
          saveStatus === 'error' && 'text-danger opacity-100',
        )}>
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Error'}
        </span>
      </div>

      {focusModeActive && (
        <FocusMode>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="mb-4 w-full bg-transparent text-xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:outline-none"
          />
          <CodeMirrorEditor
            value={content}
            onChange={handleContentChange}
            fontSize={fontSize}
            tabSize={tabSize}
            lineHeight={lineHeight}
            contentMaxWidth={contentMaxWidth}
            fontFamily={fontFamily}
          />
        </FocusMode>
      )}
    </>
  );
}
