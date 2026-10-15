'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFolders } from '@/hooks/use-folders';
import { useFoldersStore } from '@/stores/folders-store';
import { cn } from '@/lib/utils';

export interface FolderRowItem {
  key: string;
  label: string;
  href: string;
  count: number;
  icon: 'folder' | 'notes';
  /** Shown before the count, e.g. "3 folders". */
  detail?: string;
  /** Set for real folders, which get the long-press menu. */
  folderId?: string;
}

interface MenuState {
  folderId: string;
  x: number;
  y: number;
}

export function MobileFolderRows({ items }: { items: FolderRowItem[] }) {
  const folders = useFoldersStore((s) => s.folders);
  const { createFolder, renameFolder, deleteFolder } = useFolders();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('touchstart', close);
    document.addEventListener('mousedown', close);
    return () => {
      document.removeEventListener('touchstart', close);
      document.removeEventListener('mousedown', close);
    };
  }, [menu]);

  const handleRename = useCallback(async () => {
    const folder = folders.find((f) => f.id === menu?.folderId);
    setMenu(null);
    if (!folder) return;
    const name = prompt('Rename folder', folder.name);
    if (name && name.trim()) await renameFolder(folder.id, name.trim());
  }, [menu, folders, renameFolder]);

  const handleNewSubfolder = useCallback(async () => {
    if (!menu) return;
    setMenu(null);
    await createFolder(menu.folderId);
  }, [menu, createFolder]);

  const handleDelete = useCallback(async () => {
    const folder = folders.find((f) => f.id === menu?.folderId);
    setMenu(null);
    if (folder && confirm(`Delete "${folder.name}"? Notes in this folder will be unfiled.`)) {
      await deleteFolder(folder.id);
    }
  }, [menu, folders, deleteFolder]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="mx-2 rounded-lg bg-bg-secondary divide-y divide-border overflow-hidden">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            // Android fires contextmenu on long-press, so one handler covers touch and right-click.
            onContextMenu={item.folderId ? (e) => {
              e.preventDefault();
              setMenu({ folderId: item.folderId!, x: e.clientX, y: e.clientY });
            } : undefined}
            className="flex items-center gap-3 px-3 py-3 text-[15px] text-text-primary select-none active:bg-bg-tertiary transition-colors"
          >
            {item.icon === 'folder' ? <FolderIcon /> : <NotesIcon />}
            <span className="flex-1 truncate">{item.label}</span>
            {item.detail && <span className="text-[11px] text-text-muted">{item.detail}</span>}
            <span className="w-5 text-right text-xs text-text-muted">{item.count}</span>
            <ChevronIcon />
          </Link>
        ))}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-bg-primary shadow-lg py-1"
          style={{ left: Math.min(menu.x, window.innerWidth - 180), top: menu.y + 8 }}
        >
          <button onClick={handleRename} className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary">
            Rename
          </button>
          <button onClick={handleNewSubfolder} className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary">
            New subfolder
          </button>
          <div className="my-1 border-t border-border" />
          <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-bg-secondary">
            Delete
          </button>
        </div>
      )}
    </>
  );
}

export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{children}</span>
      {action}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

export function NotesIcon({ className = 'h-[18px] w-[18px] text-text-muted' }: { className?: string }) {
  return (
    <svg className={cn('shrink-0', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
