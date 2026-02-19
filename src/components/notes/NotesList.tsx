'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NoteCard } from './NoteCard';
import { useNotes } from '@/hooks/use-notes';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[];
  currentNoteId?: string | null;
  isLoading?: boolean;
  onNoteClick?: (note: Note) => void;
}

export function NotesList({ notes, currentNoteId, isLoading, onNoteClick }: NotesListProps) {
  const { reorderPinnedNotes } = useNotes();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pinnedNotes = notes
    .filter((n) => n.is_pinned)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const unpinnedNotes = notes.filter((n) => !n.is_pinned);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = pinnedNotes.findIndex((n) => n.id === active.id);
      const newIndex = pinnedNotes.findIndex((n) => n.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...pinnedNotes];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      reorderPinnedNotes(reordered.map((n) => n.id));
    },
    [pinnedNotes, reorderPinnedNotes]
  );

  if (isLoading) {
    return (
      <div className="space-y-1 px-2 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg px-3.5 py-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-bg-tertiary" />
            <div className="mt-2 h-3 w-full rounded bg-bg-tertiary" />
            <div className="mt-1.5 h-2.5 w-16 rounded bg-bg-tertiary" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return null;
  }

  const hasPinned = pinnedNotes.length > 0;

  return (
    <div className="px-2 py-2">
      {hasPinned && (
        <>
          <div className="px-3.5 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Pinned
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pinnedNotes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isActive={note.id === currentNoteId}
                  isDraggable
                  onClick={onNoteClick}
                />
              ))}
            </SortableContext>
          </DndContext>

          {unpinnedNotes.length > 0 && (
            <div className="px-3.5 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Other
            </div>
          )}
        </>
      )}
      {unpinnedNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isActive={note.id === currentNoteId}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
}
