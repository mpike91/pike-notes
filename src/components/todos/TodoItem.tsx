'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from './PriorityBadge';
import type { TodoItem as TodoItemType } from '@/types';

interface TodoItemProps {
  item: TodoItemType;
  onToggle: () => void;
  onUpdate: (updates: Partial<TodoItemType>) => void;
  onDelete: () => void;
}

export function TodoItem({ item, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    const trimmed = content.trim();
    if (trimmed && trimmed !== item.content) {
      onUpdate({ content: trimmed });
    } else {
      setContent(item.content);
    }
    setEditing(false);
  }

  function cyclePriority() {
    const next = item.priority === 3 ? 1 : (item.priority + 1);
    onUpdate({ priority: next });
  }

  return (
    <div className={cn(
      'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
      'hover:bg-bg-secondary',
      item.is_completed && 'opacity-60'
    )}>
      {/* Drag handle (visual only for now) */}
      <div className="cursor-grab text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
          item.is_completed
            ? 'border-accent bg-accent text-white'
            : 'border-input-border hover:border-accent'
        )}
      >
        {item.is_completed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Priority badge */}
      <PriorityBadge priority={item.priority} onClick={cyclePriority} />

      {/* Content */}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setContent(item.content); setEditing(false); }
          }}
          className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none"
        />
      ) : (
        <span
          className={cn(
            'flex-1 text-sm cursor-text',
            item.is_completed ? 'text-text-muted line-through' : 'text-text-primary'
          )}
          onClick={() => !item.is_completed && setEditing(true)}
        >
          {item.content}
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-danger transition-all"
        aria-label="Delete item"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
