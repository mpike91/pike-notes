/** Which list the Notes screen shows. On mobile it lives in the URL so the back gesture walks it. */
export type NotesView =
  | { kind: 'home' }
  | { kind: 'all' }
  | { kind: 'unfiled' }
  | { kind: 'folder'; id: string };

interface ViewState {
  selectedFolderId: string | null;
  showUnfiled: boolean;
  showAllNotes: boolean;
}

/** `drill` marks a push made by tapping into a list, so the back arrow knows it can pop history. */
export function notesHref(view: NotesView, { drill = false } = {}): string {
  const params = new URLSearchParams();
  if (view.kind === 'folder') params.set('folder', view.id);
  else if (view.kind !== 'home') params.set('view', view.kind);
  if (drill && view.kind !== 'home') params.set('nav', '1');
  const query = params.toString();
  return query ? `/notes?${query}` : '/notes';
}

export function parseNotesView(params: URLSearchParams): NotesView {
  const folder = params.get('folder');
  if (folder) return { kind: 'folder', id: folder };
  const view = params.get('view');
  if (view === 'all' || view === 'unfiled') return { kind: view };
  return { kind: 'home' };
}

export function viewFromState({ selectedFolderId, showUnfiled, showAllNotes }: ViewState): NotesView {
  if (selectedFolderId) return { kind: 'folder', id: selectedFolderId };
  if (showUnfiled) return { kind: 'unfiled' };
  if (showAllNotes) return { kind: 'all' };
  return { kind: 'home' };
}
