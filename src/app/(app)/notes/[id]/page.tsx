'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const saveStatus = useNotesStore((s) => s.saveStatus);
  const { updateNote, pinNote, archiveNote, unarchiveNote, trashNote, deleteNote, duplicateNote, createNote } = useNotes();
  const { tabSize, fontSize } = useSettingsStore();
  const { focusModeActive, toggleFocusMode } = useUIStore();

  useEffect(() => {
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

  const shortcuts = useMemo(() => [
    { key: 's', ctrl: true, action: handleForceSave },
    { key: 'f', ctrl: true, shift: true, action: toggleFocusMode },
    { key: 'n', ctrl: true, action: async () => {
      const newNote = await createNote();
      if (newNote) router.push(`/notes/${newNote.id}`);
    }},
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
      />
      <div className="flex flex-1 flex-col overflow-hidden px-5 py-4 md:px-8">
        <CodeMirrorEditor
          value={content}
          onChange={handleContentChange}
          fontSize={fontSize}
          tabSize={tabSize}
          autoFocus
        />
      </div>

      {focusModeActive && (
        <FocusMode>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="mb-4 w-full bg-transparent text-xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <CodeMirrorEditor
            value={content}
            onChange={handleContentChange}
            fontSize={fontSize}
            tabSize={tabSize}
          />
        </FocusMode>
      )}
    </>
  );
}
