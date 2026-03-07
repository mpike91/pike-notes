import { describe, it, expect } from 'vitest';
import type { Folder } from '@/types';
import {
  buildFolderTree,
  flattenTree,
  isDescendant,
  getFolderDepth,
  getMaxDescendantDepth,
  getFolderPath,
  getDescendantIds,
} from '@/lib/folder-utils';

function makeFolder(overrides: Partial<Folder> & { id: string }): Folder {
  return {
    user_id: 'user1',
    parent_id: null,
    name: `Folder ${overrides.id}`,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- buildFolderTree ---

describe('buildFolderTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  it('creates root nodes at depth 0 for flat folders', () => {
    const folders = [makeFolder({ id: 'a' }), makeFolder({ id: 'b' })];
    const tree = buildFolderTree(folders);
    expect(tree).toHaveLength(2);
    expect(tree[0].depth).toBe(0);
    expect(tree[1].depth).toBe(0);
    expect(tree[0].children).toEqual([]);
  });

  it('builds correct parent-child relationships and depths', () => {
    const folders = [
      makeFolder({ id: 'root', sort_order: 0 }),
      makeFolder({ id: 'child', parent_id: 'root', sort_order: 0 }),
      makeFolder({ id: 'grandchild', parent_id: 'child', sort_order: 0 }),
    ];
    const tree = buildFolderTree(folders);
    expect(tree).toHaveLength(1);
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children[0].depth).toBe(2);
    expect(tree[0].children[0].children[0].folder.id).toBe('grandchild');
  });

  it('sorts children by sort_order', () => {
    const folders = [
      makeFolder({ id: 'root' }),
      makeFolder({ id: 'b', parent_id: 'root', sort_order: 2 }),
      makeFolder({ id: 'a', parent_id: 'root', sort_order: 1 }),
      makeFolder({ id: 'c', parent_id: 'root', sort_order: 3 }),
    ];
    const tree = buildFolderTree(folders);
    const childIds = tree[0].children.map((c) => c.folder.id);
    expect(childIds).toEqual(['a', 'b', 'c']);
  });

  it('treats orphaned parent_id as root', () => {
    const folders = [
      makeFolder({ id: 'a', parent_id: 'nonexistent' }),
      makeFolder({ id: 'b' }),
    ];
    const tree = buildFolderTree(folders);
    expect(tree).toHaveLength(2);
    expect(tree.map((n) => n.folder.id).sort()).toEqual(['a', 'b']);
  });
});

// --- flattenTree ---

describe('flattenTree', () => {
  const folders = [
    makeFolder({ id: 'root', sort_order: 0 }),
    makeFolder({ id: 'child1', parent_id: 'root', sort_order: 1 }),
    makeFolder({ id: 'child2', parent_id: 'root', sort_order: 2 }),
    makeFolder({ id: 'grandchild', parent_id: 'child1', sort_order: 0 }),
  ];
  const tree = buildFolderTree(folders);

  it('returns empty array for empty tree', () => {
    expect(flattenTree([], new Set())).toEqual([]);
  });

  it('returns all nodes when all expanded', () => {
    const expanded = new Set(['root', 'child1', 'child2']);
    const flat = flattenTree(tree, expanded);
    expect(flat.map((n) => n.folder.id)).toEqual(['root', 'child1', 'grandchild', 'child2']);
  });

  it('excludes children of collapsed parents', () => {
    const flat = flattenTree(tree, new Set());
    expect(flat.map((n) => n.folder.id)).toEqual(['root']);
  });

  it('handles mixed expand state', () => {
    const flat = flattenTree(tree, new Set(['root']));
    expect(flat.map((n) => n.folder.id)).toEqual(['root', 'child1', 'child2']);
  });
});

// --- isDescendant ---

describe('isDescendant', () => {
  const folders = [
    makeFolder({ id: 'a' }),
    makeFolder({ id: 'b', parent_id: 'a' }),
    makeFolder({ id: 'c', parent_id: 'b' }),
    makeFolder({ id: 'd' }),
  ];

  it('detects direct child as descendant', () => {
    expect(isDescendant(folders, 'a', 'b')).toBe(true);
  });

  it('detects deep descendant', () => {
    expect(isDescendant(folders, 'a', 'c')).toBe(true);
  });

  it('returns false for non-descendant', () => {
    expect(isDescendant(folders, 'a', 'd')).toBe(false);
  });

  it('returns true when parentId === targetId (self)', () => {
    expect(isDescendant(folders, 'a', 'a')).toBe(true);
  });
});

// --- getFolderDepth ---

describe('getFolderDepth', () => {
  const folders = [
    makeFolder({ id: 'a' }),
    makeFolder({ id: 'b', parent_id: 'a' }),
    makeFolder({ id: 'c', parent_id: 'b' }),
  ];

  it('returns 0 for root folder', () => {
    expect(getFolderDepth(folders, 'a')).toBe(0);
  });

  it('returns correct depth for nested folder', () => {
    expect(getFolderDepth(folders, 'c')).toBe(2);
  });
});

// --- getMaxDescendantDepth ---

describe('getMaxDescendantDepth', () => {
  const folders = [
    makeFolder({ id: 'a' }),
    makeFolder({ id: 'b', parent_id: 'a' }),
    makeFolder({ id: 'c', parent_id: 'b' }),
    makeFolder({ id: 'd', parent_id: 'c' }),
  ];

  it('returns 0 for leaf folder', () => {
    expect(getMaxDescendantDepth(folders, 'd')).toBe(0);
  });

  it('returns correct max depth for folder with subtree', () => {
    expect(getMaxDescendantDepth(folders, 'a')).toBe(3);
  });
});

// --- getFolderPath ---

describe('getFolderPath', () => {
  const folders = [
    makeFolder({ id: 'a', name: 'A' }),
    makeFolder({ id: 'b', parent_id: 'a', name: 'B' }),
    makeFolder({ id: 'c', parent_id: 'b', name: 'C' }),
  ];

  it('returns path of length 1 for root folder', () => {
    const path = getFolderPath(folders, 'a');
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe('a');
  });

  it('returns full path from root for deeply nested folder', () => {
    const path = getFolderPath(folders, 'c');
    expect(path.map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });
});

// --- getDescendantIds ---

describe('getDescendantIds', () => {
  const folders = [
    makeFolder({ id: 'a' }),
    makeFolder({ id: 'b', parent_id: 'a' }),
    makeFolder({ id: 'c', parent_id: 'a' }),
    makeFolder({ id: 'd', parent_id: 'b' }),
  ];

  it('returns all descendant ids', () => {
    const ids = getDescendantIds(folders, 'a');
    expect(ids.sort()).toEqual(['b', 'c', 'd']);
  });

  it('returns empty array for leaf folder', () => {
    expect(getDescendantIds(folders, 'd')).toEqual([]);
  });
});
