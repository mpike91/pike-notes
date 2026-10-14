import { describe, it, expect } from 'vitest';
import { EditorState, EditorSelection, type StateCommand } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { history, undo, moveLineUp, moveLineDown } from '@codemirror/commands';
import {
  indentList,
  outdentList,
  continueList,
  clearEmptyListItem,
  renumberLists,
  parseListItem,
} from '@/lib/editor/lists';

// `|` marks a cursor; `[` and `]` mark a selection.
function makeState(markup: string) {
  const anchorMark = markup.includes('[') ? '[' : '|';
  const anchor = markup.indexOf(anchorMark);
  const stripped = markup.replace(/[|[\]]/g, '');
  const head = anchorMark === '[' ? markup.replace('[', '').indexOf(']') : anchor;
  return EditorState.create({
    doc: stripped,
    selection: EditorSelection.single(anchor, head),
    extensions: [history(), indentUnit.of('  '), renumberLists],
  });
}

function run(state: EditorState, cmd: StateCommand) {
  let next = state;
  const handled = cmd({ state, dispatch: (tr) => { next = tr.state; } });
  return { state: next, handled };
}

function apply(markup: string, ...cmds: StateCommand[]) {
  let state = makeState(markup);
  for (const cmd of cmds) state = run(state, cmd).state;
  return state.doc.toString();
}

function cursorLineText(state: EditorState) {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  return line.text.slice(0, head - line.from) + '|' + line.text.slice(head - line.from);
}

describe('parseListItem', () => {
  it('recognizes numbers, single letters, and bullets', () => {
    expect(parseListItem('  12. x')?.kind).toBe('number');
    expect(parseListItem('a) x')?.kind).toBe('letter');
    expect(parseListItem('- x')?.kind).toBe('bullet');
  });

  it('ignores prose that only resembles a marker', () => {
    expect(parseListItem('ok) fine')).toBeNull();
    expect(parseListItem('** prayed twice')).toBeNull();
    expect(parseListItem('1.5 litres')).toBeNull();
  });
});

describe('indentList', () => {
  it('turns a numbered item into the first lettered sub-item and renumbers the rest', () => {
    expect(apply('1. a\n2. b|\n3. c', indentList)).toBe('1. a\n  a) b\n2. c');
  });

  it('continues an existing sub-list instead of restarting at a)', () => {
    expect(apply('1. a\n  a) b\n2. c|\n3. d', indentList)).toBe('1. a\n  a) b\n  b) c\n2. d');
  });

  it('cycles a lettered item to a bullet one level down', () => {
    expect(apply('1. a\n  a) b\n  b) c|', indentList)).toBe('1. a\n  a) b\n    - c');
  });

  it('adopts the style of an existing sibling at the new depth', () => {
    expect(apply('1. a\n  - x\n2. b|', indentList)).toBe('1. a\n  - x\n  - b');
  });

  it('keeps bullets as bullets', () => {
    expect(apply('- a\n- b|', indentList)).toBe('- a\n  - b');
  });

  it('indents every selected line, renumbering as it goes', () => {
    expect(apply('1. a\n[2. b\n3. c]\n4. d', indentList)).toBe('1. a\n  a) b\n  b) c\n2. d');
  });

  it('does not indent the line a selection merely ends at the start of', () => {
    expect(apply('1. a\n[2. b\n]3. c', indentList)).toBe('1. a\n  a) b\n2. c');
  });

  it('indents plain lines without touching their text', () => {
    expect(apply('hello|', indentList)).toBe('  hello');
  });

  it('keeps the cursor on the same character', () => {
    const { state } = run(makeState('1. a\n2. bo|b'), indentList);
    expect(cursorLineText(state)).toBe('  a) bo|b');
  });
});

describe('outdentList', () => {
  it('turns a lettered sub-item back into a numbered item and renumbers below', () => {
    expect(apply('1. a\n  a) b\n  b) c|\n2. d', outdentList)).toBe('1. a\n  a) b\n2. c\n3. d');
  });

  it('keeps a bullet a bullet when its new siblings are bullets', () => {
    expect(apply('- a\n  - b|', outdentList)).toBe('- a\n- b');
  });

  it('renumbers the sub-list left behind', () => {
    expect(apply('1. a\n  a) b|\n  b) c\n  c) d', outdentList)).toBe('1. a\n2. b\n  a) c\n  b) d');
  });

  it('outdents every selected line', () => {
    expect(apply('1. a\n  [a) b\n  b) c]\n2. d', outdentList)).toBe('1. a\n2. b\n3. c\n4. d');
  });

  it('leaves a top-level line alone', () => {
    expect(apply('1. a|', outdentList)).toBe('1. a');
  });

  it('is the inverse of indentList for a simple sub-item', () => {
    expect(apply('1. a\n2. b|\n3. c', indentList, outdentList)).toBe('1. a\n2. b\n3. c');
  });
});

describe('continueList', () => {
  it('inserts the next number and renumbers the items after it', () => {
    const { state } = run(makeState('1. a|\n2. b'), continueList);
    expect(state.doc.toString()).toBe('1. a\n2. \n3. b');
    expect(cursorLineText(state)).toBe('2. |');
  });

  it('continues letters at the same depth', () => {
    expect(apply('1. a\n  a) x|', continueList)).toBe('1. a\n  a) x\n  b) ');
  });

  it('carries the text after the cursor onto the new item', () => {
    expect(apply('1. ab|cd', continueList)).toBe('1. ab\n2. cd');
  });

  it('clears an empty item instead of continuing', () => {
    expect(apply('1. a\n2. |', continueList)).toBe('1. a\n');
  });

  it('declines outside a list so the default Enter runs', () => {
    expect(run(makeState('plain|'), continueList).handled).toBe(false);
  });
});

describe('clearEmptyListItem', () => {
  it('removes a bare marker on Backspace', () => {
    expect(apply('1. a\n  a) |', clearEmptyListItem)).toBe('1. a\n');
  });
});

describe('renumbering after other edits', () => {
  it('renumbers when lines move', () => {
    expect(apply('1. a\n2. b|', moveLineUp)).toBe('1. b\n2. a');
  });

  it('moves every selected line together', () => {
    expect(apply('[1. a\n2. b]\n3. c', moveLineDown)).toBe('1. c\n2. a\n3. b');
  });

  it('renumbers when a line is deleted', () => {
    let state = makeState('1. a|\n2. b\n3. c');
    state = state.update({ changes: { from: 0, to: 5 }, userEvent: 'delete.line' }).state;
    expect(state.doc.toString()).toBe('1. b\n2. c');
  });

  it('restarts each sub-list under its own parent', () => {
    expect(apply('1. a\n  a) x\n  b) y\n2. b|\n  c) z', continueList))
      .toBe('1. a\n  a) x\n  b) y\n2. b\n3. \n  a) z');
  });

  it('leaves other lists in the note alone', () => {
    expect(apply('1. a|\n2. b\n\n5. x\n7. y', continueList)).toBe('1. a\n2. \n3. b\n\n5. x\n7. y');
  });

  it('does not rewrite numbers while typing', () => {
    let state = makeState('1. a\n3. b|');
    state = state.update({ changes: { from: state.doc.length, insert: 'x' }, userEvent: 'input.type' }).state;
    expect(state.doc.toString()).toBe('1. a\n3. bx');
  });

  it('ignores remote content synced in without a user event', () => {
    let state = makeState('|');
    state = state.update({ changes: { from: 0, insert: '1. a\n3. b' } }).state;
    expect(state.doc.toString()).toBe('1. a\n3. b');
  });

  it('undoes the edit and its renumbering in one step', () => {
    const state = run(run(makeState('1. a|\n2. b'), continueList).state, undo).state;
    expect(state.doc.toString()).toBe('1. a\n2. b');
  });
});
