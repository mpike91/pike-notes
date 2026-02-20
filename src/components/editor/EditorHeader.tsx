'use client';

import { NoteActions } from '@/components/notes/NoteActions';
import { useUIStore } from '@/stores/ui-store';
import type { Note } from '@/types';

interface EditorHeaderProps {
  note: Note;
  title: string;
  onTitleChange: (title: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onPin: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onBack: () => void;
  onNewNote?: () => void;
  titleRef?: React.RefObject<HTMLInputElement | null>;
  onSetHomeNote?: () => void;
  onClearHomeNote?: () => void;
  isHomeNote?: boolean;
}

export function EditorHeader({
  note,
  title,
  onTitleChange,
  saveStatus,
  onPin,
  onArchive,
  onTrash,
  onDelete,
  onRestore,
  onDuplicate,
  onCopy,
  onBack,
  onNewNote,
  titleRef,
  onSetHomeNote,
  onClearHomeNote,
  isHomeNote,
}: EditorHeaderProps) {
  const toggleSplitView = useUIStore((s) => s.toggleSplitView);
  const splitViewActive = useUIStore((s) => s.splitViewActive);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-toolbar-bg px-4 py-2.5 md:px-6">
      <button
        onClick={onBack}
        tabIndex={-1}
        className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
        aria-label="Back to notes"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {onNewNote && (
        <button
          onClick={onNewNote}
          tabIndex={-1}
          className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
          aria-label="New note"
          title="New note"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-base font-medium text-text-primary placeholder:text-text-muted focus:outline-none! focus-visible:outline-none!"
      />

      {/* Quick actions — always visible */}
      {!note.is_trashed && (
        <>
          <button
            onClick={onArchive}
            tabIndex={-1}
            className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label={note.is_archived ? 'Unarchive' : 'Archive'}
            title={note.is_archived ? 'Unarchive' : 'Archive'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          <button
            onClick={onTrash}
            tabIndex={-1}
            className="rounded-md p-1.5 text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
            aria-label="Move to trash"
            title="Move to trash"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </>
      )}

      {/* Split view toggle — desktop only */}
      <button
        onClick={() => toggleSplitView(note.id)}
        tabIndex={-1}
        className={`hidden md:inline-flex rounded-md p-1.5 transition-colors ${
          splitViewActive
            ? 'text-accent bg-accent/10'
            : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary'
        }`}
        aria-label="Toggle split view"
        title="Split view"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
        </svg>
      </button>

      {/* Overflow menu */}
      <NoteActions
        note={note}
        onPin={onPin}
        onArchive={onArchive}
        onTrash={onTrash}
        onDelete={onDelete}
        onRestore={onRestore}
        onDuplicate={onDuplicate}
        onCopy={onCopy}
        onSetHomeNote={onSetHomeNote}
        onClearHomeNote={onClearHomeNote}
        isHomeNote={isHomeNote}
      />
    </div>
  );
}
