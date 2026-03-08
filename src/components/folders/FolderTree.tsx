'use client';

import { useMemo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useFolders } from '@/hooks/use-folders';
import { useFoldersStore } from '@/stores/folders-store';
import { useUIStore } from '@/stores/ui-store';
import { buildFolderTree, flattenTree } from '@/lib/folder-utils';
import { FolderTreeItem } from './FolderTreeItem';
import { cn } from '@/lib/utils';

export function FolderTree() {
  const {
    folders,
    selectedFolderId,
    expandedFolderIds,
    setSelectedFolderId,
    toggleFolderExpanded,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useFolders();

  const showUnfiled = useFoldersStore((s) => s.showUnfiled);
  const setShowUnfiled = useFoldersStore((s) => s.setShowUnfiled);

  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const flatNodes = useMemo(() => flattenTree(tree, expandedFolderIds), [tree, expandedFolderIds]);

  const handleCreateSubfolder = useCallback((parentId: string) => {
    createFolder(parentId);
  }, [createFolder]);

  // Drop target for "All Notes" (unfiled)
  const { isOver: isOverAll, setNodeRef: setAllRef } = useDroppable({
    id: 'folder-drop-all',
    data: { type: 'folder', folderId: null },
  });

  if (sidebarCollapsed) {
    return (
      <div className="px-2 py-1">
        <button
          onClick={() => setShowUnfiled(true)}
          className="flex justify-center w-full rounded-md p-2 text-text-muted hover:text-text-secondary hover:bg-sidebar-hover transition-colors"
          title="Folders"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      {/* Section header */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Folders
        </span>
        <button
          onClick={() => createFolder()}
          className="rounded p-0.5 text-text-muted hover:text-text-secondary hover:bg-sidebar-hover transition-colors"
          title="New folder"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Home (unfiled notes) */}
      <div
        ref={setAllRef}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer',
          showUnfiled
            ? 'bg-sidebar-active text-text-primary font-medium'
            : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary',
          isOverAll && 'ring-1 ring-accent bg-accent/10'
        )}
        onClick={() => setShowUnfiled(true)}
      >
        <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <span>Home</span>
      </div>

      {/* Folder tree */}
      <div className="mt-0.5 space-y-0.5">
        {flatNodes.map((node) => (
          <FolderTreeItem
            key={node.folder.id}
            node={node}
            isSelected={selectedFolderId === node.folder.id}
            isExpanded={expandedFolderIds.has(node.folder.id)}
            onSelect={setSelectedFolderId}
            onToggleExpand={toggleFolderExpanded}
            onRename={renameFolder}
            onDelete={deleteFolder}
            onCreateSubfolder={handleCreateSubfolder}
            sidebarCollapsed={sidebarCollapsed}
          />
        ))}
      </div>
    </div>
  );
}
