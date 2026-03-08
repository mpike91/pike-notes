'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useFoldersStore } from '@/stores/folders-store';
import { useFolders } from '@/hooks/use-folders';
import { buildFolderTree, flattenTree, getFolderPath } from '@/lib/folder-utils';
import { cn } from '@/lib/utils';

interface ContextMenu {
  folderId: string;
  x: number;
  y: number;
}

export function MobileFolderBar() {
  const folders = useFoldersStore((s) => s.folders);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const showUnfiled = useFoldersStore((s) => s.showUnfiled);
  const setSelectedFolderId = useFoldersStore((s) => s.setSelectedFolderId);
  const setShowUnfiled = useFoldersStore((s) => s.setShowUnfiled);
  const { createFolder, renameFolder, deleteFolder } = useFolders();

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allExpanded = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const flatNodes = useMemo(() => flattenTree(tree, allExpanded), [tree, allExpanded]);

  // Close menu on outside tap
  useEffect(() => {
    if (!contextMenu) return;
    const handleTouch = (e: TouchEvent | MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('mousedown', handleTouch);
    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('mousedown', handleTouch);
    };
  }, [contextMenu]);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((folderId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ folderId, x: touch.clientX, y: touch.clientY });
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearLongPress();
    }
  }, [clearLongPress]);

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
    touchStart.current = null;
  }, [clearLongPress]);

  const handleCreateFolder = useCallback(async () => {
    await createFolder(null);
  }, [createFolder]);

  const handleRename = useCallback(async () => {
    if (!contextMenu) return;
    const folder = folders.find((f) => f.id === contextMenu.folderId);
    if (!folder) return;
    setContextMenu(null);
    const name = prompt('Rename folder', folder.name);
    if (name && name.trim()) {
      await renameFolder(folder.id, name.trim());
    }
  }, [contextMenu, folders, renameFolder]);

  const handleNewSubfolder = useCallback(async () => {
    if (!contextMenu) return;
    setContextMenu(null);
    await createFolder(contextMenu.folderId);
  }, [contextMenu, createFolder]);

  const handleDelete = useCallback(async () => {
    if (!contextMenu) return;
    const folder = folders.find((f) => f.id === contextMenu.folderId);
    if (!folder) return;
    setContextMenu(null);
    if (confirm(`Delete "${folder.name}"? Notes in this folder will be unfiled.`)) {
      await deleteFolder(folder.id);
    }
  }, [contextMenu, folders, deleteFolder]);

  if (folders.length === 0 && !contextMenu) {
    return (
      <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-b border-border bg-bg-primary">
        <button
          onClick={handleCreateFolder}
          className="shrink-0 rounded-full w-7 h-7 flex items-center justify-center bg-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
          aria-label="New folder"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-border bg-bg-primary scrollbar-none">
        <button
          onClick={() => { setSelectedFolderId(null); setShowUnfiled(false); }}
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            selectedFolderId === null && !showUnfiled
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
          )}
        >
          All Notes
        </button>
        <button
          onClick={() => setShowUnfiled(true)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            showUnfiled
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
          )}
        >
          Home
        </button>
        {flatNodes.map((node) => {
          const label = node.depth > 0
            ? getFolderPath(folders, node.folder.id).map((f) => f.name).join(' > ')
            : node.folder.name;
          return (
            <button
              key={node.folder.id}
              onClick={() => setSelectedFolderId(node.folder.id)}
              onTouchStart={(e) => handleTouchStart(node.folder.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap select-none',
                selectedFolderId === node.folder.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
              )}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={handleCreateFolder}
          className="shrink-0 rounded-full w-7 h-7 flex items-center justify-center bg-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
          aria-label="New folder"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Long-press context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-bg-primary shadow-lg py-1"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: contextMenu.y + 8,
          }}
        >
          <button
            onClick={handleRename}
            className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary transition-colors"
          >
            Rename
          </button>
          <button
            onClick={handleNewSubfolder}
            className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary transition-colors"
          >
            New subfolder
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-bg-secondary transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
}
