'use client';

import Link from 'next/link';
import { cn, formatDate, truncate } from '@/lib/utils';
import type { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
}

export function NoteCard({ note, isActive }: NoteCardProps) {
  const preview = note.content ? truncate(note.content.replace(/\n/g, ' '), 120) : '';

  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn(
        'block rounded-lg border p-3 transition-colors',
        isActive
          ? 'border-accent bg-accent/5'
          : 'border-border-subtle hover:border-border hover:bg-bg-secondary'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {note.is_pinned && (
              <svg className="h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            )}
            <h3 className="text-sm font-medium text-text-primary truncate">
              {note.title || 'Untitled'}
            </h3>
          </div>
          {preview && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2 leading-relaxed">
              {preview}
            </p>
          )}
        </div>
        {note.note_type === 'todo' && (
          <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            Todo
          </span>
        )}
      </div>
      <div className="mt-2 text-[11px] text-text-muted">
        {formatDate(note.updated_at)}
      </div>
    </Link>
  );
}
