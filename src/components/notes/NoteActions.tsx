'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

interface NoteActionsProps {
  note: Note;
  onPin: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onSetHomeNote?: () => void;
  onClearHomeNote?: () => void;
  isHomeNote?: boolean;
}

export function NoteActions({
  note,
  onPin,
  onArchive,
  onTrash,
  onDelete,
  onRestore,
  onDuplicate,
  onCopy,
  onSetHomeNote,
  onClearHomeNote,
  isHomeNote,
}: NoteActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isTrashed = note.is_trashed;
  const isArchived = note.is_archived;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        tabIndex={-1}
        className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
        aria-label="Note actions"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-md">
          {isTrashed ? (
            <>
              <MenuItem onClick={() => { onRestore(); setOpen(false); }}>
                Restore
              </MenuItem>
              <MenuItem onClick={() => { onDelete(); setOpen(false); }} danger>
                Delete permanently
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem onClick={() => { onPin(); setOpen(false); }}>
                {note.is_pinned ? 'Unpin' : 'Pin to top'}
              </MenuItem>
              {isArchived ? (
                <MenuItem onClick={() => { onArchive(); setOpen(false); }}>
                  Unarchive
                </MenuItem>
              ) : (
                <MenuItem onClick={() => { onArchive(); setOpen(false); }}>
                  Archive
                </MenuItem>
              )}
              <MenuItem onClick={() => { onDuplicate(); setOpen(false); }}>
                Duplicate
              </MenuItem>
              <MenuItem onClick={() => { onCopy(); setOpen(false); }}>
                Copy to clipboard
              </MenuItem>
              {onSetHomeNote && onClearHomeNote && (
                isHomeNote ? (
                  <MenuItem onClick={() => { onClearHomeNote(); setOpen(false); }}>
                    Remove as home note
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => { onSetHomeNote(); setOpen(false); }}>
                    Set as home note
                  </MenuItem>
                )
              )}
              <div className="my-1 border-t border-border" />
              <MenuItem onClick={() => { onTrash(); setOpen(false); }} danger>
                Move to trash
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 text-sm transition-colors',
        danger
          ? 'text-danger hover:bg-danger/5'
          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}
