'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
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
  const activeData = args.active.data.current;
  const activeFolderId = activeData?.type === 'folder-drag' ? activeData.folderId : null;

  // Check pointer-within first — this catches folder droppables
  const pointerCollisions = pointerWithin(args);
  const folderHit = pointerCollisions.find((c) => {
    const data = c.data?.droppableContainer?.data?.current;
    if (data?.type !== 'folder') return false;
    // Skip a folder's own drop zone when dragging it
    if (activeFolderId && data.folderId === activeFolderId) return false;
    return true;
  });
  if (folderHit) return [folderHit];

  // Fall back to closestCenter for sortable note reordering
  return closestCenter(args);
};

export function DndProvider({ children }: DndProviderProps) {
  const { moveNoteToFolder, moveFolder } = useFolders();
  const { reorderPinnedNotes, reorderNotes } = useNotes();
  const notes = useNotesStore((s) => s.notes);
  const sortBy = useNotesStore((s) => s.sortBy);

  const [activeDrag, setActiveDrag] = useState<{ type: string; name?: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'folder-drag') {
      setActiveDrag({ type: 'folder', name: data.folderName as string });
    } else {
      setActiveDrag(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Folder dropped on folder
    if (activeData?.type === 'folder-drag' && overData?.type === 'folder') {
      const folderId = activeData.folderId as string;
      const targetFolderId = overData.folderId as string | null;
      moveFolder(folderId, targetFolderId);
      return;
    }

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
  }, [moveNoteToFolder, moveFolder, reorderPinnedNotes, reorderNotes, notes, sortBy]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={folderFirstCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeDrag?.type === 'folder' && (
          <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-surface border border-border shadow-lg text-text-primary">
            <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            {activeDrag.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
