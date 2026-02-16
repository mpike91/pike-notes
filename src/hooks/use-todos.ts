'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotesStore } from '@/stores/notes-store';
import type { TodoItem, TodoItemInsert, TodoItemUpdate } from '@/types';
import { generateSortOrder } from '@/lib/utils';

export function useTodos(noteId: string) {
  const store = useNotesStore();
  const items = store.todoItems[noteId] || [];

  const fetchTodoItems = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('note_id', noteId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching todo items:', error);
      return;
    }

    store.setTodoItems(noteId, data || []);
  }, [noteId]);

  const addTodoItem = useCallback(async (content: string, priority: number = 2) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const lastItem = items.filter((i) => !i.is_completed).at(-1);
    const sortOrder = generateSortOrder(lastItem?.sort_order ?? 0);

    const newItem: TodoItemInsert = {
      note_id: noteId,
      user_id: user.id,
      content,
      priority,
      sort_order: sortOrder,
    };

    const { data, error } = await supabase
      .from('todo_items')
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error('Error adding todo item:', error);
      return null;
    }

    store.addTodoItem(data);
    return data;
  }, [noteId, items]);

  const updateTodoItem = useCallback(async (id: string, updates: TodoItemUpdate) => {
    const supabase = createClient();

    // Optimistic update
    store.updateTodoItem(id, noteId, updates as Partial<TodoItem>);

    // If marking as completed, set completed_at
    if (updates.is_completed === true) {
      updates.completed_at = new Date().toISOString();
    } else if (updates.is_completed === false) {
      updates.completed_at = null;
    }

    const { error } = await supabase
      .from('todo_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating todo item:', error);
      await fetchTodoItems();
    }
  }, [noteId, fetchTodoItems]);

  const deleteTodoItem = useCallback(async (id: string) => {
    const supabase = createClient();
    store.removeTodoItem(id, noteId);

    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo item:', error);
      await fetchTodoItems();
    }
  }, [noteId, fetchTodoItems]);

  const reorderTodoItem = useCallback(async (id: string, newIndex: number) => {
    const incomplete = items.filter((i) => !i.is_completed);
    const above = newIndex > 0 ? incomplete[newIndex - 1]?.sort_order : null;
    const below = newIndex < incomplete.length - 1 ? incomplete[newIndex + 1]?.sort_order : null;
    const newSortOrder = generateSortOrder(above, below);

    await updateTodoItem(id, { sort_order: newSortOrder });
  }, [items, updateTodoItem]);

  const activeItems = items.filter((i) => !i.is_completed).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const completedItems = items.filter((i) => i.is_completed).sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return bTime - aTime;
  });

  return {
    items,
    activeItems,
    completedItems,
    fetchTodoItems,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
    reorderTodoItem,
  };
}
