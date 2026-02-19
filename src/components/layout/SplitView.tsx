'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useNotes } from '@/hooks/use-notes';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { SplitPaneNotesList } from '@/components/layout/SplitPaneNotesList';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

export function SplitView() {
  const {
    splitViewFocusedPane,
    splitViewLeftNoteId,
    splitViewRightNoteId,
    setSplitViewFocusedPane,
    setSplitViewNoteId,
  } = useUIStore();

  const { createNote } = useNotes();

  const handleNoteSelect = useCallback(
    (pane: 'left' | 'right') => (note: Note) => {
      setSplitViewNoteId(pane, note.id);
      setSplitViewFocusedPane(pane);
    },
    [setSplitViewNoteId, setSplitViewFocusedPane]
  );

  const handleNewNote = useCallback(
    (pane: 'left' | 'right') => async () => {
      const note = await createNote();
      if (note) {
        setSplitViewNoteId(pane, note.id);
        setSplitViewFocusedPane(pane);
      }
    },
    [createNote, setSplitViewNoteId, setSplitViewFocusedPane]
  );

  const handleBack = useCallback(
    (pane: 'left' | 'right') => () => {
      setSplitViewNoteId(pane, null);
    },
    [setSplitViewNoteId]
  );

  return (
    <div className="flex h-full">
      {/* Left Pane */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden border-r border-border',
          splitViewFocusedPane === 'left' && 'ring-2 ring-accent/20 ring-inset rounded-lg'
        )}
        onClick={() => setSplitViewFocusedPane('left')}
      >
        {splitViewLeftNoteId ? (
          <NoteEditor
            noteId={splitViewLeftNoteId}
            onBack={handleBack('left')}
          />
        ) : (
          <SplitPaneNotesList
            onNoteSelect={handleNoteSelect('left')}
            onNewNote={handleNewNote('left')}
          />
        )}
      </div>

      {/* Right Pane */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          splitViewFocusedPane === 'right' && 'ring-2 ring-accent/20 ring-inset rounded-lg'
        )}
        onClick={() => setSplitViewFocusedPane('right')}
      >
        {splitViewRightNoteId ? (
          <NoteEditor
            noteId={splitViewRightNoteId}
            onBack={handleBack('right')}
          />
        ) : (
          <SplitPaneNotesList
            onNoteSelect={handleNoteSelect('right')}
            onNewNote={handleNewNote('right')}
          />
        )}
      </div>
    </div>
  );
}
