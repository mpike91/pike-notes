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
        'block rounded-lg px-3.5 py-3 transition-colors',
        isActive
          ? 'bg-accent/8 text-text-primary'
          : 'hover:bg-bg-secondary'
      )}
    >
      <div className="flex items-center gap-1.5">
        {note.is_pinned && (
          <svg className="h-3 w-3 shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
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
      <div className="mt-1.5 text-[11px] text-text-muted">
        {formatDate(note.updated_at)}
      </div>
    </Link>
  );
}
