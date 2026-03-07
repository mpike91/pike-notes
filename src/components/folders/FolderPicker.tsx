'use client';

import { useMemo } from 'react';
import { useFoldersStore } from '@/stores/folders-store';
import { buildFolderTree, flattenTree } from '@/lib/folder-utils';
import { cn } from '@/lib/utils';

interface FolderPickerProps {
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onClose: () => void;
}

export function FolderPicker({ currentFolderId, onSelect, onClose }: FolderPickerProps) {
  const folders = useFoldersStore((s) => s.folders);
  const allExpanded = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const flatNodes = useMemo(() => flattenTree(tree, allExpanded), [tree, allExpanded]);

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-surface py-1 shadow-md max-h-64 overflow-y-auto">
      <button
        onClick={() => { onSelect(null); onClose(); }}
        className={cn(
          'w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2',
          currentFolderId === null
            ? 'text-accent bg-accent/5'
            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
        )}
      >
        <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        No folder
      </button>
      {flatNodes.map((node) => (
        <button
          key={node.folder.id}
          onClick={() => { onSelect(node.folder.id); onClose(); }}
          className={cn(
            'w-full text-left py-1.5 text-sm transition-colors flex items-center gap-2',
            currentFolderId === node.folder.id
              ? 'text-accent bg-accent/5'
              : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
          )}
          style={{ paddingLeft: `${node.depth * 16 + 12}px`, paddingRight: '12px' }}
        >
          <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <span className="truncate">{node.folder.name}</span>
        </button>
      ))}
      {folders.length === 0 && (
        <div className="px-3 py-2 text-xs text-text-muted">No folders yet</div>
      )}
    </div>
  );
}
