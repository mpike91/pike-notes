'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { FolderTreeNode } from '@/types';

interface FolderTreeItemProps {
  node: FolderTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  sidebarCollapsed: boolean;
}

export function FolderTreeItem({
  node,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onRename,
  onDelete,
  onCreateSubfolder,
  sidebarCollapsed,
}: FolderTreeItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.folder.name);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;

  const { isOver, setNodeRef } = useDroppable({
    id: `folder-drop-${node.folder.id}`,
    data: { type: 'folder', folderId: node.folder.id },
  });

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.folder.name) {
      onRename(node.folder.id, trimmed);
    } else {
      setRenameValue(node.folder.name);
    }
    setIsRenaming(false);
  }, [renameValue, node.folder.id, node.folder.name, onRename]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDeleteClick = useCallback(() => {
    setContextMenu(null);
    if (confirm(`Delete folder "${node.folder.name}"? Notes inside will become unfiled.`)) {
      onDelete(node.folder.id);
    }
  }, [node.folder.id, node.folder.name, onDelete]);

  if (sidebarCollapsed) return null;

  return (
    <div ref={setNodeRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors group',
          isSelected
            ? 'bg-sidebar-active text-text-primary font-medium'
            : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary',
          isOver && 'ring-1 ring-accent bg-accent/5'
        )}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        onClick={() => onSelect(node.folder.id)}
        onDoubleClick={() => { setIsRenaming(true); setRenameValue(node.folder.name); }}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(node.folder.id); }}
          className={cn(
            'shrink-0 p-0.5 rounded transition-colors',
            hasChildren ? 'text-text-muted hover:text-text-secondary' : 'invisible'
          )}
        >
          <svg
            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {isExpanded && hasChildren ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          )}
        </svg>

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setRenameValue(node.folder.name); setIsRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent text-sm text-text-primary focus:outline-none border-b border-accent"
          />
        ) : (
          <span className="truncate flex-1">{node.folder.name}</span>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[100] w-40 rounded-lg border border-border bg-surface py-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { setContextMenu(null); setIsRenaming(true); setRenameValue(node.folder.name); }}
            className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            Rename
          </button>
          <button
            onClick={() => { setContextMenu(null); onCreateSubfolder(node.folder.id); }}
            className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            New subfolder
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleDeleteClick}
            className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
