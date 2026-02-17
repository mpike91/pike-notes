'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view';
import {
  defaultKeymap,
  indentWithTab,
  moveLineUp,
  moveLineDown,
  deleteLine,
} from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  tabSize?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CodeMirrorEditor({
  value,
  onChange,
  fontSize = 15,
  tabSize = 2,
  placeholder = 'Start writing...',
  autoFocus = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether we're currently updating from external value
  const isExternalUpdate = useRef(false);

  const createTheme = useCallback(
    () =>
      EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          height: '100%',
          flex: '1',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        '.cm-content': {
          lineHeight: '1.7',
          padding: '0',
          minHeight: '100%',
          caretColor: 'var(--accent)',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          padding: '2px 0',
        },
        '.cm-cursor': {
          borderLeftColor: 'var(--accent)',
          borderLeftWidth: '2px',
        },
        '.cm-selectionBackground': {
          backgroundColor: 'var(--accent) !important',
          opacity: '0.2',
        },
        '&.cm-focused .cm-selectionBackground': {
          backgroundColor: 'var(--accent) !important',
          opacity: '0.25',
        },
        '.cm-placeholder': {
          color: 'var(--text-muted)',
        },
        '.cm-gutters': {
          display: 'none',
        },
      }),
    [fontSize]
  );

  // Custom keymap for cut-line when nothing selected (Ctrl+X)
  const cutLineKeymap = keymap.of([
    {
      key: 'Ctrl-x',
      run: (view) => {
        const { state } = view;
        const { from, to } = state.selection.main;
        if (from === to) {
          // Nothing selected — cut entire line
          const line = state.doc.lineAt(from);
          const lineText = state.doc.sliceString(line.from, line.to);
          navigator.clipboard.writeText(lineText + '\n');
          view.dispatch({
            changes: {
              from: line.from,
              to: Math.min(line.to + 1, state.doc.length),
            },
          });
          return true;
        }
        return false; // Let default Ctrl+X handle selected text
      },
    },
    {
      key: 'Alt-ArrowUp',
      run: moveLineUp,
    },
    {
      key: 'Alt-ArrowDown',
      run: moveLineDown,
    },
    {
      key: 'Ctrl-Shift-k',
      run: deleteLine,
    },
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        cutLineKeymap,
        keymap.of([indentWithTab]),
        keymap.of(defaultKeymap),
        indentUnit.of(' '.repeat(tabSize)),
        EditorView.lineWrapping,
        createTheme(),
        placeholderExt(placeholder),
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isExternalUpdate.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    if (autoFocus) {
      requestAnimationFrame(() => view.focus());
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only recreate when tabSize or fontSize changes, not on value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSize, fontSize]);

  // Sync external value changes without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto [&_.cm-editor]:h-full"
    />
  );
}
