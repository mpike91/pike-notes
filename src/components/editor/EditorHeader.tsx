'use client';

import { cn } from '@/lib/utils';
import { NoteActions } from '@/components/notes/NoteActions';
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
  onToggleType: () => void;
  onBack: () => void;
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
  onToggleType,
  onBack,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2">
      {/* Back button (always visible, key for mobile) */}
      <button
        onClick={onBack}
        className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
        aria-label="Back to notes"
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-base font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      {/* Save status */}
      <span className={cn(
        'text-xs transition-opacity duration-200',
        saveStatus === 'idle' && 'opacity-0',
        saveStatus === 'saving' && 'text-text-muted opacity-100',
        saveStatus === 'saved' && 'text-success opacity-100',
        saveStatus === 'error' && 'text-danger opacity-100',
      )}>
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
        {saveStatus === 'error' && 'Error'}
      </span>

      {/* Actions menu */}
      <NoteActions
        note={note}
        onPin={onPin}
        onArchive={onArchive}
        onTrash={onTrash}
        onDelete={onDelete}
        onRestore={onRestore}
        onDuplicate={onDuplicate}
        onCopy={onCopy}
        onToggleType={onToggleType}
      />
    </div>
  );
}
