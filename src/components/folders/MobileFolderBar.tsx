'use client';

import { useMemo } from 'react';
import { useFoldersStore } from '@/stores/folders-store';
import { buildFolderTree, flattenTree, getFolderPath } from '@/lib/folder-utils';
import { cn } from '@/lib/utils';

export function MobileFolderBar() {
  const folders = useFoldersStore((s) => s.folders);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const setSelectedFolderId = useFoldersStore((s) => s.setSelectedFolderId);

  const allExpanded = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const flatNodes = useMemo(() => flattenTree(tree, allExpanded), [tree, allExpanded]);

  if (folders.length === 0) return null;

  return (
    <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-border bg-bg-primary scrollbar-none">
      <button
        onClick={() => setSelectedFolderId(null)}
        className={cn(
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          selectedFolderId === null
            ? 'bg-accent text-white'
            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
        )}
      >
        All
      </button>
      {flatNodes.map((node) => {
        const label = node.depth > 0
          ? getFolderPath(folders, node.folder.id).map((f) => f.name).join(' > ')
          : node.folder.name;
        return (
          <button
            key={node.folder.id}
            onClick={() => setSelectedFolderId(node.folder.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              selectedFolderId === node.folder.id
                ? 'bg-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
