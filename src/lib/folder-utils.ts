import type { Folder, FolderTreeNode } from '@/types';

export const MAX_FOLDER_DEPTH = 5;

export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  // Create nodes
  for (const folder of folders) {
    map.set(folder.id, { folder, children: [], depth: 0 });
  }

  // Build tree
  for (const folder of folders) {
    const node = map.get(folder.id)!;
    if (folder.parent_id && map.has(folder.parent_id)) {
      const parent = map.get(folder.parent_id)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Fix depths recursively and sort children
  function setDepths(nodes: FolderTreeNode[], depth: number) {
    nodes.sort((a, b) => (a.folder.sort_order ?? 0) - (b.folder.sort_order ?? 0));
    for (const node of nodes) {
      node.depth = depth;
      setDepths(node.children, depth + 1);
    }
  }
  setDepths(roots, 0);

  return roots;
}

export function flattenTree(tree: FolderTreeNode[], expandedIds: Set<string>): FolderTreeNode[] {
  const result: FolderTreeNode[] = [];

  function walk(nodes: FolderTreeNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0 && expandedIds.has(node.folder.id)) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}

export function isDescendant(folders: Folder[], parentId: string, targetId: string): boolean {
  const childrenMap = new Map<string, string[]>();
  for (const f of folders) {
    if (f.parent_id) {
      const siblings = childrenMap.get(f.parent_id) || [];
      siblings.push(f.id);
      childrenMap.set(f.parent_id, siblings);
    }
  }

  const stack = [parentId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === targetId) return true;
    const children = childrenMap.get(current);
    if (children) stack.push(...children);
  }
  return false;
}

export function getFolderDepth(folders: Folder[], folderId: string): number {
  let depth = 0;
  let current = folders.find((f) => f.id === folderId);
  while (current?.parent_id) {
    depth++;
    current = folders.find((f) => f.id === current!.parent_id);
  }
  return depth;
}

export function getMaxDescendantDepth(folders: Folder[], folderId: string): number {
  let max = 0;
  const childrenMap = new Map<string, string[]>();
  for (const f of folders) {
    if (f.parent_id) {
      const siblings = childrenMap.get(f.parent_id) || [];
      siblings.push(f.id);
      childrenMap.set(f.parent_id, siblings);
    }
  }

  function walk(id: string, depth: number) {
    if (depth > max) max = depth;
    const children = childrenMap.get(id);
    if (children) {
      for (const child of children) walk(child, depth + 1);
    }
  }
  walk(folderId, 0);
  return max;
}

export function getFolderPath(folders: Folder[], folderId: string): Folder[] {
  const path: Folder[] = [];
  let current = folders.find((f) => f.id === folderId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? folders.find((f) => f.id === current!.parent_id) : undefined;
  }
  return path;
}

export function getDescendantIds(folders: Folder[], folderId: string): string[] {
  const ids: string[] = [];
  const childrenMap = new Map<string, string[]>();
  for (const f of folders) {
    if (f.parent_id) {
      const siblings = childrenMap.get(f.parent_id) || [];
      siblings.push(f.id);
      childrenMap.set(f.parent_id, siblings);
    }
  }

  function walk(id: string) {
    const children = childrenMap.get(id);
    if (children) {
      for (const child of children) {
        ids.push(child);
        walk(child);
      }
    }
  }
  walk(folderId);
  return ids;
}
