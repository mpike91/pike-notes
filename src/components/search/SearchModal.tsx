'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatDate, truncate } from '@/lib/utils';
import { useNotesStore } from '@/stores/notes-store';
import { useUIStore } from '@/stores/ui-store';
import type { Note, Theme } from '@/types';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'note' | 'command';
  note?: Note;
  command?: {
    label: string;
    action: () => void;
  };
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const notes = useNotesStore((s) => s.notes);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);

  const isCommandMode = query.startsWith('>');

  const commands: SearchResult[] = [
    { type: 'command', command: { label: 'New Note', action: async () => { onClose(); /* Handled by Ctrl+N shortcut or notes page */ router.push('/notes'); } } },
    { type: 'command', command: { label: 'Theme: Light', action: () => { setTheme('light' as Theme); onClose(); } } },
    { type: 'command', command: { label: 'Theme: Dark (Gray)', action: () => { setTheme('dark-gray' as Theme); onClose(); } } },
    { type: 'command', command: { label: 'Theme: Dark (Slate)', action: () => { setTheme('dark-slate' as Theme); onClose(); } } },
    { type: 'command', command: { label: 'Theme: Dark (Wine)', action: () => { setTheme('dark-wine' as Theme); onClose(); } } },
    { type: 'command', command: { label: 'Theme: Dark (Moss)', action: () => { setTheme('dark-moss' as Theme); onClose(); } } },
    { type: 'command', command: { label: 'Toggle Focus Mode', action: () => { toggleFocusMode(); onClose(); } } },
    { type: 'command', command: { label: 'Settings', action: () => { router.push('/settings'); onClose(); } } },
    { type: 'command', command: { label: 'Archive', action: () => { router.push('/archive'); onClose(); } } },
    { type: 'command', command: { label: 'Trash', action: () => { router.push('/trash'); onClose(); } } },
  ];

  const getResults = useCallback((): SearchResult[] => {
    if (isCommandMode) {
      const cmdQuery = query.slice(1).toLowerCase().trim();
      if (!cmdQuery) return commands;
      return commands.filter((c) =>
        c.command!.label.toLowerCase().includes(cmdQuery)
      );
    }

    if (!query.trim()) return [];

    const q = query.toLowerCase();
    return notes
      .filter((note) =>
        !note.is_trashed &&
        (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map((note) => ({ type: 'note' as const, note }));
  }, [query, notes, isCommandMode, commands]);

  const results = getResults();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSelect(result: SearchResult) {
    if (result.type === 'note' && result.note) {
      router.push(`/notes/${result.note.id}`);
      onClose();
    } else if (result.type === 'command' && result.command) {
      result.command.action();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-md overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3">
          <svg className="h-4.5 w-4.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search notes or type ">" for commands...'
            className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden md:inline-flex rounded border border-border-subtle bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((result, index) => (
              <button
                key={result.type === 'note' ? result.note!.id : result.command!.label}
                onClick={() => handleSelect(result)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent/10 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary'
                )}
              >
                {result.type === 'note' && result.note && (
                  <div>
                    <div className="font-medium">{result.note.title || 'Untitled'}</div>
                    <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                      <span>{truncate(result.note.content, 60)}</span>
                      <span>{formatDate(result.note.updated_at)}</span>
                    </div>
                  </div>
                )}
                {result.type === 'command' && result.command && (
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-xs font-mono">&gt;</span>
                    <span>{result.command.label}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query && !isCommandMode && results.length === 0 && (
          <div className="py-6 text-center text-sm text-text-muted">
            No notes found for "{query}"
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="py-4 text-center text-xs text-text-muted">
            Type to search notes, or <span className="font-mono">&gt;</span> for commands
          </div>
        )}
      </div>
    </div>
  );
}
