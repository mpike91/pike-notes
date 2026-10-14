import {
  EditorState,
  Transaction,
  type ChangeSpec,
  type StateCommand,
  type Text,
} from '@codemirror/state';
import { indentUnit } from '@codemirror/language';

export type ListKind = 'number' | 'letter' | 'bullet';

export interface ListItem {
  indentText: string;
  /** Leading whitespace width, with a tab counted as one indent unit. */
  indent: number;
  marker: string;
  kind: ListKind;
  /** Length of indent + marker + the whitespace after it. */
  prefixLength: number;
}

// Letters are a single a–z so prose like "ok) fine" is never mistaken for an item.
export const LIST_ITEM_RE = /^(\s*)([-*+]|\d+\.|[a-z]\))(\s+)/;
const EMPTY_ITEM_RE = /^\s*([-*+]|\d+\.|[a-z]\))\s*$/;

export function parseListItem(text: string, unitWidth = 2): ListItem | null {
  const match = text.match(LIST_ITEM_RE);
  if (!match) return null;
  const [whole, indentText, marker] = match;
  return {
    indentText,
    indent: indentWidth(indentText, unitWidth),
    marker,
    kind: /\d/.test(marker) ? 'number' : /[a-z]/.test(marker) ? 'letter' : 'bullet',
    prefixLength: whole.length,
  };
}

function indentWidth(whitespace: string, unitWidth: number) {
  let width = 0;
  for (const ch of whitespace) width += ch === '\t' ? unitWidth : 1;
  return width;
}

function markerFor(kind: ListKind, n: number, bullet = '-') {
  if (kind === 'number') return `${n}.`;
  if (kind === 'letter') return `${String.fromCharCode(96 + Math.min(n, 26))})`;
  return bullet;
}

const isBlank = (text: string) => text.trim() === '';

/** Nearest earlier item at `indent` under the same parent, if any. */
function findSibling(lines: string[], index: number, indent: number, unitWidth: number) {
  for (let i = index - 1; i >= 0; i--) {
    if (isBlank(lines[i])) return null;
    const item = parseListItem(lines[i], unitWidth);
    if (!item) continue;
    if (item.indent === indent) return item;
    if (item.indent < indent) return null;
  }
  return null;
}

/** Marker for an item moved to a new depth: match its new siblings, else step through 1. → a) → -. */
function restyle(item: ListItem, lines: string[], index: number, newIndent: number, unitWidth: number, deeper: boolean) {
  const sibling = findSibling(lines, index, newIndent, unitWidth);
  if (sibling) return sibling.kind === 'bullet' ? sibling.marker : markerFor(sibling.kind, 1);
  if (deeper && item.kind === 'number') return markerFor('letter', 1);
  if (deeper && item.kind === 'letter') return '-';
  if (!deeper && item.kind === 'letter') return markerFor('number', 1);
  return item.kind === 'bullet' ? item.marker : markerFor(item.kind, 1);
}

/** Line numbers covered by the selection; a range ending at column 0 doesn't claim that line. */
function selectedLines(state: EditorState) {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    let last = state.doc.lineAt(range.to).number;
    if (!range.empty && last > first && range.to === state.doc.line(last).from) last--;
    for (let n = first; n <= last; n++) lines.add(n);
  }
  return [...lines].sort((a, b) => a - b);
}

function shiftLines(state: EditorState, dispatch: (tr: Transaction) => void, deeper: boolean) {
  const unit = state.facet(indentUnit);
  const unitWidth = indentWidth(unit, 2);
  const lines = state.doc.toString().split('\n');
  const changes: ChangeSpec[] = [];

  for (const n of selectedLines(state)) {
    const line = state.doc.line(n);
    const item = parseListItem(line.text, unitWidth);
    const leading = line.text.match(/^\s*/)![0];

    let newIndentText: string;
    if (deeper) {
      newIndentText = leading + unit;
    } else if (leading.startsWith('\t')) {
      newIndentText = leading.slice(1);
    } else {
      const spaces = leading.match(/^ */)![0].length;
      if (spaces === 0) continue;
      newIndentText = leading.slice(Math.min(unitWidth, spaces));
    }

    let oldPrefix = leading;
    let newPrefix = newIndentText;
    if (item) {
      const newIndent = indentWidth(newIndentText, unitWidth);
      oldPrefix = item.indentText + item.marker;
      newPrefix = newIndentText + restyle(item, lines, n - 1, newIndent, unitWidth, deeper);
    }
    changes.push({ from: line.from, to: line.from + oldPrefix.length, insert: newPrefix });
    lines[n - 1] = newPrefix + line.text.slice(oldPrefix.length);
  }

  if (changes.length) {
    const changeSet = state.changes(changes);
    dispatch(state.update({
      changes: changeSet,
      selection: state.selection.map(changeSet, 1),
      userEvent: deeper ? 'input.indent' : 'delete.dedent',
    }));
  }
  return true;
}

export const indentList: StateCommand = ({ state, dispatch }) => shiftLines(state, dispatch, true);
export const outdentList: StateCommand = ({ state, dispatch }) => shiftLines(state, dispatch, false);

/** Enter inside a list item: start the next item, or clear an item that is only a marker. */
export const continueList: StateCommand = ({ state, dispatch }) => {
  const range = state.selection.main;
  if (!range.empty) return false;
  const pos = range.head;
  const line = state.doc.lineAt(pos);

  if (EMPTY_ITEM_RE.test(line.text)) {
    dispatch(state.update({
      changes: { from: line.from, to: line.to },
      selection: { anchor: line.from },
      userEvent: 'delete',
    }));
    return true;
  }

  const item = parseListItem(line.text);
  if (!item) return false;

  if (pos === line.from) {
    dispatch(state.update({ changes: { from: pos, insert: '\n' }, selection: { anchor: pos }, userEvent: 'input' }));
    return true;
  }

  // Placeholder marker; renumberLists assigns the real number in the same transaction.
  const marker = item.kind === 'bullet' ? item.marker : markerFor(item.kind, 1);
  const prefix = `\n${item.indentText}${marker} `;
  dispatch(state.update({
    changes: { from: pos, to: line.to, insert: prefix + state.doc.sliceString(pos, line.to) },
    selection: { anchor: pos + prefix.length },
    userEvent: 'input',
  }));
  return true;
};

/** Backspace on an item that is only a marker removes the marker. */
export const clearEmptyListItem: StateCommand = ({ state, dispatch }) => {
  const range = state.selection.main;
  if (!range.empty) return false;
  const line = state.doc.lineAt(range.head);
  if (!EMPTY_ITEM_RE.test(line.text) || range.head === line.from) return false;
  dispatch(state.update({
    changes: { from: line.from, to: line.to },
    selection: { anchor: line.from },
    userEvent: 'delete.backward',
  }));
  return true;
};

function blockBounds(doc: Text, lineNo: number): [number, number] {
  let start = lineNo;
  let end = lineNo;
  while (start > 1 && !isBlank(doc.line(start - 1).text)) start--;
  while (end < doc.lines && !isBlank(doc.line(end + 1).text)) end++;
  return [start, end];
}

/** Rewrites ordered markers in lines start..end so each sub-list counts 1, 2, 3 / a, b, c. */
function renumberBlock(doc: Text, start: number, end: number, unitWidth: number): ChangeSpec[] {
  const changes: ChangeSpec[] = [];
  const levels: { indent: number; kind: ListKind; n: number }[] = [];

  for (let n = start; n <= end; n++) {
    const line = doc.line(n);
    const item = parseListItem(line.text, unitWidth);
    if (!item) continue;
    while (levels.length && levels[levels.length - 1].indent > item.indent) levels.pop();
    let level = levels[levels.length - 1];
    if (!level || level.indent < item.indent) {
      level = { indent: item.indent, kind: item.kind, n: 0 };
      levels.push(level);
    }
    // A bullet between numbered items doesn't break their count.
    if (item.kind === 'bullet') continue;
    if (level.kind !== item.kind) {
      level.kind = item.kind;
      level.n = 0;
    }
    level.n++;
    const expected = markerFor(item.kind, level.n);
    if (expected !== item.marker) {
      const from = line.from + item.indentText.length;
      changes.push({ from, to: from + item.marker.length, insert: expected });
    }
  }
  return changes;
}

function changesLineStructure(tr: Transaction) {
  let structural = false;
  tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const doc = tr.startState.doc;
    if (inserted.lines > 1 || doc.lineAt(fromA).number !== doc.lineAt(toA).number) structural = true;
  });
  return structural;
}

function shouldRenumber(tr: Transaction) {
  if (!tr.docChanged) return false;
  const event = tr.annotation(Transaction.userEvent);
  // No user event means a programmatic sync (e.g. a remote edit); leave its text as authored.
  if (!event || event.startsWith('undo') || event.startsWith('redo')) return false;
  // Typing a digit mid-list shouldn't jump numbers under the cursor; only line breaks count.
  if (event.startsWith('input.type')) return changesLineStructure(tr);
  return true;
}

/** Keeps ordered lists sequential after structural edits (Enter, indent, move, delete, paste). */
export const renumberLists = EditorState.transactionFilter.of((tr) => {
  if (!shouldRenumber(tr)) return tr;
  const doc = tr.newDoc;
  const unitWidth = indentWidth(tr.startState.facet(indentUnit), 2);

  const blocks = new Map<number, number>();
  tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
    const first = Math.max(1, doc.lineAt(fromB).number - 1);
    const last = Math.min(doc.lines, doc.lineAt(toB).number + 1);
    for (let n = first; n <= last; n++) {
      if (isBlank(doc.line(n).text)) continue;
      const [start, end] = blockBounds(doc, n);
      blocks.set(start, end);
      n = end;
    }
  });

  const changes = [...blocks].flatMap(([start, end]) => renumberBlock(doc, start, end, unitWidth));
  if (!changes.length) return tr;
  return [tr, { changes, sequential: true }];
});
