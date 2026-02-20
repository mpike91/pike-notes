'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  moveLineUp,
  moveLineDown,
  deleteLine,
} from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';

const FONT_FAMILY_MAP: Record<string, string> = {
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
};

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  tabSize?: number;
  placeholder?: string;
  autoFocus?: boolean;
  lineHeight?: number;
  contentMaxWidth?: number | null;
  fontFamily?: string;
}

export function CodeMirrorEditor({
  value,
  onChange,
  fontSize = 15,
  tabSize = 2,
  placeholder = 'Start writing...',
  autoFocus = false,
  lineHeight = 1.5,
  contentMaxWidth = null,
  fontFamily = 'inter',
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether we're currently updating from external value
  const isExternalUpdate = useRef(false);

  const resolvedFontFamily = FONT_FAMILY_MAP[fontFamily] || FONT_FAMILY_MAP.inter;

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
          fontFamily: resolvedFontFamily,
        },
        '.cm-content': {
          lineHeight: String(lineHeight),
          padding: '0',
          minHeight: '100%',
          caretColor: 'var(--accent)',
          ...(contentMaxWidth ? { maxWidth: `${contentMaxWidth}px`, margin: '0 auto' } : {}),
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          padding: '0',
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
    [fontSize, lineHeight, contentMaxWidth, resolvedFontFamily]
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

  // List continuation: Enter continues lists, Enter/Backspace on empty list items exits list mode
  const listKeymap = keymap.of([
    {
      key: 'Enter',
      run: (view) => {
        const { state } = view;
        const range = state.selection.main;
        if (!range.empty) return false;

        const pos = range.head;
        const line = state.doc.lineAt(pos);
        const lineText = state.doc.sliceString(line.from, line.to);

        // Match list markers: "- ", "* ", "+ ", "1. ", "12. ", etc.
        const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s/);
        if (!listMatch) return false;

        const [fullMatch, indent, marker] = listMatch;
        const contentAfterMarker = lineText.slice(fullMatch.length);

        // Empty list item: exit list mode
        if (contentAfterMarker.trim() === '') {
          view.dispatch({
            changes: { from: line.from, to: line.to, insert: '' },
            selection: { anchor: line.from },
          });
          return true;
        }

        // Non-empty: continue list, carrying text after cursor to the new line
        const newMarker = /^\d+\./.test(marker)
          ? `${parseInt(marker) + 1}.`
          : marker;
        const textAfterCursor = state.doc.sliceString(pos, line.to);
        const newLinePrefix = `\n${indent}${newMarker} `;

        view.dispatch({
          changes: { from: pos, to: line.to, insert: newLinePrefix + textAfterCursor },
          selection: { anchor: pos + newLinePrefix.length },
        });
        return true;
      },
    },
    {
      key: 'Backspace',
      run: (view) => {
        const { state } = view;
        const range = state.selection.main;
        if (!range.empty) return false;

        const pos = range.head;
        const line = state.doc.lineAt(pos);
        const lineText = state.doc.sliceString(line.from, line.to);

        // Only handle lines that are JUST a list marker with no content
        const listMatch = lineText.match(/^(\s*)([-*+]|\d+\.)\s*$/);
        if (!listMatch) return false;

        // Don't intercept if cursor is at the very start of the line (default backspace joins lines)
        if (pos === line.from) return false;

        // Remove the marker, cursor to line start
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: '' },
          selection: { anchor: line.from },
        });
        return true;
      },
    },
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        listKeymap,
        cutLineKeymap,
        keymap.of([...historyKeymap, indentWithTab]),
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
    // Only recreate when editor settings change, not on value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSize, fontSize, lineHeight, contentMaxWidth, fontFamily]);

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
