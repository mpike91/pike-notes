'use client';

import Link from 'next/link';
import { cn, formatDate, truncate } from '@/lib/utils';
import type { Note } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
  isDraggable?: boolean;
  onClick?: (note: Note) => void;
}

export function NoteCard({ note, isActive, isDraggable, onClick }: NoteCardProps) {
  const preview = note.content ? truncate(note.content.replace(/\n/g, ' '), 120) : '';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    disabled: !isDraggable,
  });

  const style = isDraggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const content = (
    <>
      <div className="flex items-center gap-1.5">
        {isDraggable && (
          <span
            className="shrink-0 cursor-grab text-text-muted/50 hover:text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            {...listeners}
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="5" cy="3" r="1.2" />
              <circle cx="11" cy="3" r="1.2" />
              <circle cx="5" cy="8" r="1.2" />
              <circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="13" r="1.2" />
              <circle cx="11" cy="13" r="1.2" />
            </svg>
          </span>
        )}
        {note.is_pinned && !isDraggable && (
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
    </>
  );

  const className = cn(
    'block rounded-lg px-3.5 py-3 transition-colors group',
    isActive
      ? 'bg-accent/8 text-text-primary'
      : 'hover:bg-bg-secondary'
  );

  if (onClick) {
    return (
      <button
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={() => onClick(note)}
        className={cn(className, 'w-full text-left')}
      >
        {content}
      </button>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={`/notes/${note.id}`} className={className}>
        {content}
      </Link>
    </div>
  );
}
