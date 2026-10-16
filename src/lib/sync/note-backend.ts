import { createClient } from '@/lib/supabase/client';
import { flushOfflineQueue } from './engine';
import { enqueueWrite } from './offline-queue';
import type { DraftBackend } from './draft';

function unwrap<T>({ data, error }: { data: T; error: unknown }): NonNullable<T> {
  if (error) throw error;
  if (data == null) throw new Error('Note not found');
  return data;
}

export function supabaseDraftBackend(): DraftBackend {
  const supabase = createClient();
  return {
    flushQueue: flushOfflineQueue,
    fetchUpdatedAt: async (id) =>
      unwrap(await supabase.from('notes').select('updated_at').eq('id', id).single()).updated_at,
    fetchSaved: async (id) => {
      const row = unwrap(await supabase.from('notes').select('title, content, updated_at').eq('id', id).single());
      return { title: row.title ?? '', content: row.content ?? '', updatedAt: row.updated_at };
    },
    update: async (id, draft) =>
      unwrap(await supabase.from('notes').update(draft).eq('id', id).select('updated_at').single()).updated_at,
    enqueue: (id, draft) => enqueueWrite({ table: 'notes', operation: 'update', data: { id, ...draft } }),
  };
}
