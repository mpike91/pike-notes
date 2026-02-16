'use client';

import { useState, useEffect } from 'react';
import { TodoItem } from './TodoItem';
import { useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';

interface TodoEditorProps {
  noteId: string;
}

export function TodoEditor({ noteId }: TodoEditorProps) {
  const {
    activeItems,
    completedItems,
    fetchTodoItems,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
  } = useTodos(noteId);

  const [newItemContent, setNewItemContent] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    fetchTodoItems();
  }, [fetchTodoItems]);

  async function handleAddItem() {
    const trimmed = newItemContent.trim();
    if (!trimmed) return;
    await addTodoItem(trimmed);
    setNewItemContent('');
  }

  const total = activeItems.length + completedItems.length;
  const completed = completedItems.length;

  return (
    <div className="space-y-2">
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-2 px-2 text-xs text-text-muted">
          <div className="h-1.5 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <span>{completed}/{total}</span>
        </div>
      )}

      {/* Empty state hint */}
      {total === 0 && (
        <p className="px-2 text-xs text-text-muted">
          Type below and press Enter to add your first item.
        </p>
      )}

      {/* Active items */}
      <div className="space-y-0.5">
        {activeItems.map((item) => (
          <TodoItem
            key={item.id}
            item={item}
            onToggle={() => updateTodoItem(item.id, { is_completed: true })}
            onUpdate={(updates) => updateTodoItem(item.id, updates)}
            onDelete={() => deleteTodoItem(item.id)}
          />
        ))}
      </div>

      {/* Add new item */}
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border border-dashed border-input-border">
          <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <input
          type="text"
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItem();
          }}
          placeholder="Add an item..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {/* Completed section */}
      {completedItems.length > 0 && (
        <div className="pt-2 border-t border-border-subtle">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg
              className={cn('h-3 w-3 transition-transform', showCompleted && 'rotate-90')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {completedItems.length} completed
          </button>
          {showCompleted && (
            <div className="space-y-0.5 mt-1">
              {completedItems.map((item) => (
                <TodoItem
                  key={item.id}
                  item={item}
                  onToggle={() => updateTodoItem(item.id, { is_completed: false })}
                  onUpdate={(updates) => updateTodoItem(item.id, updates)}
                  onDelete={() => deleteTodoItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
