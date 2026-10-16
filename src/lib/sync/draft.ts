export interface Draft {
  title: string;
  content: string;
}

/** A note's text as last confirmed on (or queued for) the server. */
export interface SavedNote extends Draft {
  updatedAt: string;
}

export type SaveOutcome =
  | { kind: 'saved'; base: SavedNote }
  | { kind: 'queued'; base: SavedNote }
  | { kind: 'conflict'; server: SavedNote };

export interface DraftBackend {
  flushQueue: () => Promise<void>;
  fetchUpdatedAt: (id: string) => Promise<string>;
  fetchSaved: (id: string) => Promise<SavedNote>;
  /** Writes the draft and returns the row's new updated_at. */
  update: (id: string, draft: Draft) => Promise<string>;
  enqueue: (id: string, draft: Draft) => Promise<void>;
}

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const message = err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err);
  return /failed to fetch|networkerror|network request failed|load failed/i.test(message);
}

/**
 * Saves a draft unless the note's text changed elsewhere since `base` was loaded.
 * Metadata-only changes (pin, archive, move) bump updated_at but aren't conflicts.
 */
export async function saveDraft(backend: DraftBackend, id: string, draft: Draft, base: SavedNote): Promise<SaveOutcome> {
  // Checked up front because the service worker can answer reads from cache while offline.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    await backend.enqueue(id, draft);
    return { kind: 'queued', base: { ...draft, updatedAt: base.updatedAt } };
  }
  try {
    // Queued offline edits must land first, or they'd look like someone else's change.
    await backend.flushQueue();
    if ((await backend.fetchUpdatedAt(id)) !== base.updatedAt) {
      const server = await backend.fetchSaved(id);
      if (server.title === draft.title && server.content === draft.content) return { kind: 'saved', base: server };
      if (server.title !== base.title || server.content !== base.content) return { kind: 'conflict', server };
    }
    const updatedAt = await backend.update(id, draft);
    return { kind: 'saved', base: { ...draft, updatedAt } };
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await backend.enqueue(id, draft);
    return { kind: 'queued', base: { ...draft, updatedAt: base.updatedAt } };
  }
}

/** Debounces saves of "the latest draft", runs them one at a time, and saves on demand. */
export class DraftSaver {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private inFlight = 0;
  private chain: Promise<void> = Promise.resolve();

  constructor(private save: () => Promise<void>, private delay = 800) {}

  markDirty() {
    this.dirty = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  }

  /** True while an edit is waiting or a save is running; remote updates must not replace the text then. */
  get busy() {
    return this.dirty || this.inFlight > 0;
  }

  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.dirty) return this.chain;
    this.dirty = false;
    this.inFlight++;
    this.chain = this.chain
      .then(() => this.save())
      .catch((err) => console.error('Note save failed:', err))
      .finally(() => { this.inFlight--; });
    return this.chain;
  }
}
