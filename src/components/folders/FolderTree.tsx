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
          onClick={() => setSelectedFolderId(null)}
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

      {/* All Notes */}
      <div
        ref={setAllRef}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
          selectedFolderId === null
            ? 'bg-sidebar-active text-text-primary font-medium'
            : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary',
          isOverAll && 'ring-1 ring-accent bg-accent/5'
        )}
        onClick={() => setSelectedFolderId(null)}
      >
        <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span>All Notes</span>
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
