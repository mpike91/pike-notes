'use client';

import { useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { EditorState, Prec, RangeSetBuilder, Transaction } from '@codemirror/state';
import { EditorView, keymap, ViewPlugin, Decoration, type DecorationSet } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  moveLineUp,
  moveLineDown,
  deleteLine,
  redo,
  undo,
} from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import {
  indentList,
  outdentList,
  continueList,
  clearEmptyListItem,
  renumberLists,
  LIST_ITEM_RE,
} from '@/lib/editor/lists';

const FONT_FAMILY_MAP: Record<string, string> = {
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
};

export interface CodeMirrorEditorHandle {
  indent: () => void;
  outdent: () => void;
  moveUp: () => void;
  moveDown: () => void;
  undo: () => void;
  redo: () => void;
  getView: () => EditorView | null;
}

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  tabSize?: number;
  autoFocus?: boolean;
  lineHeight?: number;
  contentMaxWidth?: number | null;
  fontFamily?: string;
  hangingIndent?: boolean;
  ref?: Ref<CodeMirrorEditorHandle>;
}

export function CodeMirrorEditor({
  value,
  onChange,
  fontSize = 15,
  tabSize = 2,
  autoFocus = false,
  lineHeight = 1.5,
  contentMaxWidth = null,
  fontFamily = 'inter',
  hangingIndent = false,
  ref,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track whether we're currently updating from external value
  const isExternalUpdate = useRef(false);

  useImperativeHandle(ref, () => ({
    indent: () => {
      const view = viewRef.current;
      if (!view) return;
      indentList(view);
      view.focus();
    },
    outdent: () => {
      const view = viewRef.current;
      if (!view) return;
      outdentList(view);
      view.focus();
    },
    moveUp: () => {
      const view = viewRef.current;
      if (!view) return;
      moveLineUp(view);
      view.focus();
    },
    moveDown: () => {
      const view = viewRef.current;
      if (!view) return;
      moveLineDown(view);
      view.focus();
    },
    undo: () => {
      const view = viewRef.current;
      if (!view) return;
      undo(view);
      view.focus();
    },
    redo: () => {
      const view = viewRef.current;
      if (!view) return;
      redo(view);
      view.focus();
    },
    getView: () => viewRef.current,
  }));

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
          padding: '0 10px',
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
            userEvent: 'delete.cut',
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

  // Prec.high so list handling runs before defaultKeymap's insertNewlineAndIndent.
  const listKeymap = Prec.high(keymap.of([
    { key: 'Enter', run: continueList },
    { key: 'Backspace', run: clearEmptyListItem },
    { key: 'Tab', run: indentList, shift: outdentList },
  ]));

  // Hanging indent plugin: aligns wrapped list text with content start
  const hangingIndentPlugin = useCallback(() => {

    function buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      // Measure prefix widths in pixels using canvas (accurate for proportional fonts)
      const style = getComputedStyle(view.contentDOM);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = style.font;
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          const line = view.state.doc.lineAt(pos);
          const lineText = view.state.doc.sliceString(line.from, line.to);
          const match = lineText.match(LIST_ITEM_RE);
          if (match) {
            const pxWidth = ctx.measureText(match[0]).width;
            builder.add(
              line.from,
              line.from,
              Decoration.line({
                attributes: {
                  style: `margin-left: ${pxWidth}px; text-indent: -${pxWidth}px;`,
                },
              })
            );
          }
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }

    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = buildDecorations(view);
        }
        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view);
          }
        }
      },
      { decorations: (v) => v.decorations }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        listKeymap,
        cutLineKeymap,
        keymap.of([...historyKeymap, { key: 'Ctrl-Shift-z', run: redo }]),
        renumberLists,
        keymap.of(defaultKeymap),
        indentUnit.of(' '.repeat(tabSize)),
        EditorView.lineWrapping,
        createTheme(),
        markdown(),
        ...(hangingIndent ? [hangingIndentPlugin()] : []),
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
  }, [tabSize, fontSize, lineHeight, contentMaxWidth, fontFamily, hangingIndent]);

  // Sync external value changes without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isExternalUpdate.current = true;
      // Loads and remote edits aren't the user's typing; undoing them would save stale text.
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
        annotations: Transaction.addToHistory.of(false),
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
