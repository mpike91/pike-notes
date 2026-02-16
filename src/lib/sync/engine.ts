import { createClient } from '@/lib/supabase/client';
import { enqueueWrite, getQueuedWrites, removeQueuedWrite } from './offline-queue';

export async function flushOfflineQueue(): Promise<void> {
  const writes = await getQueuedWrites();
  if (writes.length === 0) return;

  const supabase = createClient();

  for (const write of writes) {
    try {
      if (write.operation === 'insert') {
        const { error } = await supabase
          .from(write.table)
          .insert(write.data as never);
        if (error) throw error;
      } else if (write.operation === 'update') {
        const id = write.data.id as string;
        const { id: _, ...updates } = write.data;
        const { error } = await supabase
          .from(write.table)
          .update(updates as never)
          .eq('id', id);
        if (error) throw error;
      } else if (write.operation === 'delete') {
        const id = write.data.id as string;
        const { error } = await supabase
          .from(write.table)
          .delete()
          .eq('id', id);
        if (error) throw error;
      }

      await removeQueuedWrite(write.id);
    } catch (err) {
      console.error('Failed to flush queued write:', write, err);
      break; // Stop processing on first error to maintain order
    }
  }
}
