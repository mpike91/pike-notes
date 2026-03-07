'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useFolders } from '@/hooks/use-folders';

interface DndProviderProps {
  children: React.ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const { moveNoteToFolder } = useFolders();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Note dropped on folder
    if (activeData?.type === 'note' && overData?.type === 'folder') {
      const noteId = activeData.noteId as string;
      const folderId = overData.folderId as string | null;
      moveNoteToFolder(noteId, folderId);
    }
  }, [moveNoteToFolder]);

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null} />
    </DndContext>
  );
}
