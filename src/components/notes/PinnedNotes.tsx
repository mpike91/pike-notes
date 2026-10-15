'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotesStore } from '@/stores/notes-store';
import { useUIStore } from '@/stores/ui-store';
import { getPinnedNotes } from '@/lib/note-lists';
import { cn } from '@/lib/utils';

export function PinnedNotes() {
  const notes = useNotesStore((s) => s.notes);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const pathname = usePathname();
  const pinned = useMemo(() => getPinnedNotes(notes), [notes]);

  if (pinned.length === 0) return null;

  return (
    <div className="border-t border-border px-2 py-1">
      {!sidebarCollapsed && (
        <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Pinned
        </div>
      )}
      <div className="space-y-0.5">
        {pinned.map((note) => {
          const title = note.title || 'Untitled';
          const isActive = pathname === `/notes/${note.id}`;
          return (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                sidebarCollapsed && 'justify-center',
                isActive
                  ? 'bg-sidebar-active text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
              )}
              title={title}
            >
              <NoteIcon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent' : 'text-text-muted')} />
              {!sidebarCollapsed && <span className="truncate">{title}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
