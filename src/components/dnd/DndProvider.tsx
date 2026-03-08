'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type CollisionDetection,
  DragOverlay,
  pointerWithin,
  closestCenter,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useFolders } from '@/hooks/use-folders';
import { useNotes } from '@/hooks/use-notes';
import { useNotesStore } from '@/stores/notes-store';

interface DndProviderProps {
  children: React.ReactNode;
}

/**
 * Custom collision detection: prioritize folder droppables when the pointer
 * is over them, otherwise fall back to closestCenter for sortable reordering.
 */
const folderFirstCollision: CollisionDetection = (args) => {
  // Check pointer-within first — this catches folder droppables
  const pointerCollisions = pointerWithin(args);
  const folderHit = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'folder'
  );
  if (folderHit) return [folderHit];

  // Fall back to closestCenter for sortable note reordering
  return closestCenter(args);
};

export function DndProvider({ children }: DndProviderProps) {
  const { moveNoteToFolder } = useFolders();
  const { reorderPinnedNotes, reorderNotes } = useNotes();
  const notes = useNotesStore((s) => s.notes);
  const sortBy = useNotesStore((s) => s.sortBy);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Note dropped on folder
    if (activeData?.type === 'note' && overData?.type === 'folder') {
      const noteId = activeData.noteId as string;
      const folderId = overData.folderId as string | null;
      moveNoteToFolder(noteId, folderId);
      return;
    }

    // Note reorder (pinned or unpinned in custom sort)
    if (activeData?.type === 'note' && overData?.type === 'note') {
      // Try pinned reorder first
      const pinnedNotes = notes
        .filter((n) => n.is_pinned)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      const oldPinnedIndex = pinnedNotes.findIndex((n) => n.id === active.id);
      const newPinnedIndex = pinnedNotes.findIndex((n) => n.id === over.id);

      if (oldPinnedIndex !== -1 && newPinnedIndex !== -1) {
        const reordered = [...pinnedNotes];
        const [moved] = reordered.splice(oldPinnedIndex, 1);
        reordered.splice(newPinnedIndex, 0, moved);
        reorderPinnedNotes(reordered.map((n) => n.id));
        return;
      }

      // Unpinned reorder (only in custom sort mode)
      if (sortBy === 'custom') {
        const unpinnedNotes = notes
          .filter((n) => !n.is_pinned)
          .sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER));

        const oldIndex = unpinnedNotes.findIndex((n) => n.id === active.id);
        const newIndex = unpinnedNotes.findIndex((n) => n.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = [...unpinnedNotes];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        reorderNotes(reordered.map((n) => n.id));
      }
    }
  }, [moveNoteToFolder, reorderPinnedNotes, reorderNotes, notes, sortBy]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={folderFirstCollision}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null} />
    </DndContext>
  );
}
