'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { CodeMirrorEditor } from '@/components/editor/CodeMirrorEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { useNotes } from '@/hooks/use-notes';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { useSettingsStore } from '@/stores/settings-store';
import type { Note } from '@/types';

interface NoteEditorProps {
  noteId: string;
  autoFocusTitle?: boolean;
  onBack?: () => void;
}

export function NoteEditor({ noteId, autoFocusTitle = false, onBack }: NoteEditorProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { updateNote: storeUpdateNote, pinNote, archiveNote, unarchiveNote, trashNote, deleteNote, duplicateNote } = useNotes();
  const { tabSize, fontSize, lineHeight, contentMaxWidth, fontFamily, homeNoteId, setHomeNoteId } = useSettingsStore();

  useEffect(() => {
    async function fetchNote() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error || !data) {
        if (onBack) onBack();
        else router.push('/notes');
        return;
      }

      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      setLoading(false);
    }

    fetchNote();
  }, [noteId, router, onBack]);

  useEffect(() => {
    if (autoFocusTitle && !loading && titleRef.current) {
      titleRef.current.focus();
    }
  }, [autoFocusTitle, loading]);

  const updateNote = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setSaveStatus('saving');
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id);

      if (error) {
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch {
      setSaveStatus('error');
    }
  }, []);

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

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else router.push('/notes');
  }, [onBack, router]);

  const handleCopy = useCallback(() => {
    const text = [title, content].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [title, content]);

  const handleTrash = useCallback(async () => {
    if (note) {
      await trashNote(note.id);
      handleBack();
    }
  }, [note, trashNote, handleBack]);

  const handleDelete = useCallback(async () => {
    if (note) {
      await deleteNote(note.id);
      handleBack();
    }
  }, [note, deleteNote, handleBack]);

  const handleRestore = useCallback(async () => {
    if (note) {
      await storeUpdateNote(note.id, { is_trashed: false });
      handleBack();
    }
  }, [note, storeUpdateNote, handleBack]);

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
        handleBack();
      }
    }
  }, [note, archiveNote, unarchiveNote, handleBack]);

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
    <div className="flex h-full flex-col">
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
          autoFocus={!autoFocusTitle}
        />

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
    </div>
  );
}
