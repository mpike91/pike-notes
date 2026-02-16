import { get, set, del, keys } from 'idb-keyval';

export interface QueuedWrite {
  id: string;
  table: 'notes' | 'todo_items';
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_PREFIX = 'pike-offline-';

export async function enqueueWrite(write: Omit<QueuedWrite, 'id' | 'timestamp'>): Promise<void> {
  const id = `${QUEUE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry: QueuedWrite = {
    ...write,
    id,
    timestamp: Date.now(),
  };
  await set(id, entry);
}

export async function getQueuedWrites(): Promise<QueuedWrite[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX));
  const entries: QueuedWrite[] = [];

  for (const key of queueKeys) {
    const entry = await get<QueuedWrite>(key);
    if (entry) entries.push(entry);
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeQueuedWrite(id: string): Promise<void> {
  await del(id);
}

export async function clearQueue(): Promise<void> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX));
  for (const key of queueKeys) {
    await del(key);
  }
}
