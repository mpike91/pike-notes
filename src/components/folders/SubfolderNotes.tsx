'use client';

import { useMemo } from 'react';
import { NoteCard } from '@/components/notes/NoteCard';
import { useFoldersStore } from '@/stores/folders-store';
import { buildFolderTree } from '@/lib/folder-utils';
import type { Note, Folder, FolderTreeNode } from '@/types';

interface SubfolderNotesProps {
  notes: Note[];
  folders: Folder[];
  parentFolderId: string;
  descendantFolderIds: string[];
  showSubfolders: boolean;
  onToggle: () => void;
}

interface FolderGroup {
  folder: Folder;
  notes: Note[];
  depth: number;
  children: FolderGroup[];
}

function buildFolderGroups(
  node: FolderTreeNode,
  notesByFolder: Map<string, Note[]>,
  baseDepth: number
): FolderGroup[] {
  return node.children.map((child) => ({
    folder: child.folder,
    notes: notesByFolder.get(child.folder.id) || [],
    depth: child.depth - baseDepth,
    children: buildFolderGroups(child, notesByFolder, baseDepth),
  }));
}

function FolderGroupSection({
  group,
  onSelectFolder,
}: {
  group: FolderGroup;
  onSelectFolder: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={() => onSelectFolder(group.folder.id)}
        className="flex items-center gap-2 px-3.5 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-accent transition-colors cursor-pointer"
        style={{ paddingLeft: `${group.depth * 12 + 14}px` }}
      >
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        {group.folder.name}
      </button>
      {group.notes.length > 0 && (
        <div className="space-y-1 px-2">
          {group.notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
      {group.children.map((child) => (
        <FolderGroupSection key={child.folder.id} group={child} onSelectFolder={onSelectFolder} />
      ))}
    </div>
  );
}

export function SubfolderNotes({
  notes,
  folders,
  parentFolderId,
  descendantFolderIds,
  showSubfolders,
  onToggle,
}: SubfolderNotesProps) {
  const setSelectedFolderId = useFoldersStore((s) => s.setSelectedFolderId);

  const descendantSet = useMemo(() => new Set(descendantFolderIds), [descendantFolderIds]);

  const notesByFolder = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const note of notes) {
      if (note.folder_id && descendantSet.has(note.folder_id)) {
        const existing = map.get(note.folder_id) || [];
        existing.push(note);
        map.set(note.folder_id, existing);
      }
    }
    return map;
  }, [notes, descendantSet]);

  const folderGroups = useMemo(() => {
    const tree = buildFolderTree(folders);
    // Find the parent node in the tree
    function findNode(nodes: FolderTreeNode[], id: string): FolderTreeNode | null {
      for (const node of nodes) {
        if (node.folder.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    }
    const parentNode = findNode(tree, parentFolderId);
    if (!parentNode) return [];
    return buildFolderGroups(parentNode, notesByFolder, parentNode.depth);
  }, [folders, parentFolderId, notesByFolder]);

  const totalSubfolderNotes = useMemo(() => {
    let count = 0;
    notesByFolder.forEach((n) => (count += n.length));
    return count;
  }, [notesByFolder]);

  return (
    <div className="border-t border-border">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-5 py-2.5 text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${showSubfolders ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        Sub-folders
        <span className="text-text-muted/60">
          ({descendantFolderIds.length} {descendantFolderIds.length === 1 ? 'folder' : 'folders'}, {totalSubfolderNotes} {totalSubfolderNotes === 1 ? 'note' : 'notes'})
        </span>
      </button>
      {showSubfolders && (
        <div className="pb-2">
          {folderGroups.map((group) => (
            <FolderGroupSection
              key={group.folder.id}
              group={group}
              onSelectFolder={setSelectedFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
