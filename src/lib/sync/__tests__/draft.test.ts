import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DraftSaver, saveDraft, type DraftBackend, type SavedNote } from '@/lib/sync/draft';

const base: SavedNote = { title: 'Prayer', content: '- one', updatedAt: 't1' };

function fakeBackend(server: SavedNote, overrides: Partial<DraftBackend> = {}) {
  const calls: string[] = [];
  const backend: DraftBackend = {
    flushQueue: async () => { calls.push('flush'); },
    fetchUpdatedAt: async () => { calls.push('meta'); return server.updatedAt; },
    fetchSaved: async () => { calls.push('text'); return server; },
    update: async (_id, draft) => { calls.push('update'); server = { ...draft, updatedAt: 't-new' }; return 't-new'; },
    enqueue: async () => { calls.push('enqueue'); },
    ...overrides,
  };
  return { backend, calls, server: () => server };
}

const offline = async () => { throw new TypeError('Failed to fetch'); };

describe('saveDraft', () => {
  it('saves when the server still has the version we loaded', async () => {
    const { backend, calls } = fakeBackend(base);
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- one\n- two' }, base);
    expect(outcome).toEqual({ kind: 'saved', base: { title: 'Prayer', content: '- one\n- two', updatedAt: 't-new' } });
    expect(calls).toEqual(['flush', 'meta', 'update']);
  });

  it('still saves when only metadata changed elsewhere, like a pin', async () => {
    const { backend } = fakeBackend({ ...base, updatedAt: 't2' });
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- two' }, base);
    expect(outcome.kind).toBe('saved');
  });

  it('reports a conflict instead of overwriting text edited on another device', async () => {
    const remote = { title: 'Prayer', content: '- edited on desktop', updatedAt: 't2' };
    const { backend, calls } = fakeBackend(remote);
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- edited on phone' }, base);
    expect(outcome).toEqual({ kind: 'conflict', server: remote });
    expect(calls).not.toContain('update');
  });

  it('treats a remote copy that already matches the draft as saved', async () => {
    const remote = { title: 'Prayer', content: '- same', updatedAt: 't2' };
    const { backend, calls } = fakeBackend(remote);
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- same' }, base);
    expect(outcome).toEqual({ kind: 'saved', base: remote });
    expect(calls).not.toContain('update');
  });

  it('queues the draft when offline and treats it as the new base text', async () => {
    const { backend, calls } = fakeBackend(base, { fetchUpdatedAt: offline });
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- offline edit' }, base);
    expect(outcome).toEqual({ kind: 'queued', base: { title: 'Prayer', content: '- offline edit', updatedAt: 't1' } });
    expect(calls).toContain('enqueue');
  });

  it('queues without touching the network when the browser reports offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    try {
      const { backend, calls } = fakeBackend(base);
      const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- x' }, base);
      expect(outcome.kind).toBe('queued');
      expect(calls).toEqual(['enqueue']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not flag its own queued edits as a conflict once they reach the server', async () => {
    // The queue flush wrote the offline text, so the server now differs from the loaded version.
    const queuedBase = { title: 'Prayer', content: '- offline edit', updatedAt: 't1' };
    const { backend } = fakeBackend({ title: 'Prayer', content: '- offline edit', updatedAt: 't2' });
    const outcome = await saveDraft(backend, 'n1', { title: 'Prayer', content: '- offline edit\n- more' }, queuedBase);
    expect(outcome.kind).toBe('saved');
  });

  it('rethrows errors that are not network failures', async () => {
    const { backend } = fakeBackend(base, { update: async () => { throw new Error('permission denied'); } });
    await expect(saveDraft(backend, 'n1', { title: 'x', content: 'y' }, base)).rejects.toThrow('permission denied');
  });
});

describe('DraftSaver', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves once after edits stop, however many edits there were', async () => {
    const save = vi.fn(async () => {});
    const saver = new DraftSaver(save, 800);
    saver.markDirty();
    vi.advanceTimersByTime(500);
    saver.markDirty();
    vi.advanceTimersByTime(799);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush saves pending edits immediately and the timer does not save again', async () => {
    const save = vi.fn(async () => {});
    const saver = new DraftSaver(save, 800);
    saver.markDirty();
    await saver.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush with nothing pending does not save', async () => {
    const save = vi.fn(async () => {});
    await new DraftSaver(save, 800).flush();
    expect(save).not.toHaveBeenCalled();
  });

  it('runs saves one at a time and reports busy until both finish', async () => {
    const order: string[] = [];
    let release!: () => void;
    const first = new Promise<void>((r) => { release = r; });
    let n = 0;
    const saver = new DraftSaver(async () => {
      const i = ++n;
      order.push(`start${i}`);
      if (i === 1) await first;
      order.push(`end${i}`);
    }, 800);
    saver.markDirty();
    const a = saver.flush();
    saver.markDirty();
    const b = saver.flush();
    expect(saver.busy).toBe(true);
    release();
    await Promise.all([a, b]);
    expect(order).toEqual(['start1', 'end1', 'start2', 'end2']);
    expect(saver.busy).toBe(false);
  });

  it('keeps later saves running after one fails', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    const saver = new DraftSaver(save, 800);
    saver.markDirty();
    await saver.flush();
    saver.markDirty();
    await saver.flush();
    expect(save).toHaveBeenCalledTimes(2);
  });
});
