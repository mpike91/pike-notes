'use client';

interface EditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onOutdent: () => void;
  onIndent: () => void;
  onMoveLineUp: () => void;
  onMoveLineDown: () => void;
}

// Taking focus on tap collapses the editor's selection and closes the keyboard.
function keepEditorFocus(e: React.PointerEvent | React.MouseEvent) {
  e.preventDefault();
}

/** Mobile editing bar; sits on top of the keyboard because the viewport resizes for it. */
export function EditorToolbar(props: EditorToolbarProps) {
  const buttons = [
    { label: 'Undo', onClick: props.onUndo, d: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' },
    { label: 'Redo', onClick: props.onRedo, d: 'M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3' },
    null,
    { label: 'Outdent', onClick: props.onOutdent, d: 'M15.75 19.5L8.25 12l7.5-7.5' },
    { label: 'Indent', onClick: props.onIndent, d: 'M8.25 4.5l7.5 7.5-7.5 7.5' },
    null,
    { label: 'Move line up', onClick: props.onMoveLineUp, d: 'M4.5 15.75l7.5-7.5 7.5 7.5' },
    { label: 'Move line down', onClick: props.onMoveLineDown, d: 'M19.5 8.25l-7.5 7.5-7.5-7.5' },
  ];
  return (
    <div className="md:hidden flex items-center justify-around border-t border-border bg-toolbar-bg px-1 py-1 safe-bottom">
      {buttons.map((b, i) =>
        b === null ? (
          <span key={i} className="h-6 w-px bg-border" />
        ) : (
          <button
            key={b.label}
            onClick={b.onClick}
            onPointerDown={keepEditorFocus}
            onMouseDown={keepEditorFocus}
            tabIndex={-1}
            aria-label={b.label}
            title={b.label}
            className="rounded-md p-2.5 text-text-secondary active:bg-bg-tertiary active:text-text-primary transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={b.d} />
            </svg>
          </button>
        )
      )}
    </div>
  );
}
