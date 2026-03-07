import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Folder } from '@/types';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

const { useFoldersStore } = await import('@/stores/folders-store');

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

beforeEach(() => {
  useFoldersStore.setState({
    folders: [],
    selectedFolderId: null,
    expandedFolderIds: new Set(),
  });
});

describe('setFolders / addFolder', () => {
  it('sets folders list', () => {
    const folders = [makeFolder({ id: 'a' }), makeFolder({ id: 'b' })];
    useFoldersStore.getState().setFolders(folders);
    expect(useFoldersStore.getState().folders).toEqual(folders);
  });

  it('adds new folder', () => {
    useFoldersStore.getState().addFolder(makeFolder({ id: 'a' }));
    expect(useFoldersStore.getState().folders).toHaveLength(1);
  });

  it('prevents duplicate add', () => {
    const folder = makeFolder({ id: 'a' });
    useFoldersStore.getState().addFolder(folder);
    useFoldersStore.getState().addFolder(folder);
    expect(useFoldersStore.getState().folders).toHaveLength(1);
  });
});

describe('updateFolder', () => {
  it('updates folder properties', () => {
    useFoldersStore.getState().setFolders([makeFolder({ id: 'a', name: 'Old' })]);
    useFoldersStore.getState().updateFolder('a', { name: 'New' });
    expect(useFoldersStore.getState().folders[0].name).toBe('New');
  });
});

describe('removeFolder', () => {
  it('removes folder from list', () => {
    useFoldersStore.getState().setFolders([makeFolder({ id: 'a' }), makeFolder({ id: 'b' })]);
    useFoldersStore.getState().removeFolder('a');
    expect(useFoldersStore.getState().folders.map((f) => f.id)).toEqual(['b']);
  });

  it('clears selectedFolderId if removed folder was selected', () => {
    useFoldersStore.setState({ selectedFolderId: 'a' });
    useFoldersStore.getState().setFolders([makeFolder({ id: 'a' })]);
    useFoldersStore.getState().removeFolder('a');
    expect(useFoldersStore.getState().selectedFolderId).toBeNull();
  });

  it('keeps selectedFolderId if different folder removed', () => {
    useFoldersStore.setState({ selectedFolderId: 'b' });
    useFoldersStore.getState().setFolders([makeFolder({ id: 'a' }), makeFolder({ id: 'b' })]);
    useFoldersStore.getState().removeFolder('a');
    expect(useFoldersStore.getState().selectedFolderId).toBe('b');
  });
});

describe('removeFolderAndDescendants', () => {
  it('removes folder and all descendants', () => {
    useFoldersStore.getState().setFolders([
      makeFolder({ id: 'a' }),
      makeFolder({ id: 'b', parent_id: 'a' }),
      makeFolder({ id: 'c', parent_id: 'b' }),
      makeFolder({ id: 'd' }),
    ]);
    useFoldersStore.getState().removeFolderAndDescendants('a');
    expect(useFoldersStore.getState().folders.map((f) => f.id)).toEqual(['d']);
  });

  it('clears selection if selected folder is among removed', () => {
    useFoldersStore.setState({ selectedFolderId: 'b' });
    useFoldersStore.getState().setFolders([
      makeFolder({ id: 'a' }),
      makeFolder({ id: 'b', parent_id: 'a' }),
    ]);
    useFoldersStore.getState().removeFolderAndDescendants('a');
    expect(useFoldersStore.getState().selectedFolderId).toBeNull();
  });
});

describe('toggleFolderExpanded / expandFolder', () => {
  it('toggles expansion state', () => {
    useFoldersStore.getState().toggleFolderExpanded('a');
    expect(useFoldersStore.getState().expandedFolderIds.has('a')).toBe(true);
    useFoldersStore.getState().toggleFolderExpanded('a');
    expect(useFoldersStore.getState().expandedFolderIds.has('a')).toBe(false);
  });

  it('expandFolder is idempotent', () => {
    useFoldersStore.getState().expandFolder('a');
    useFoldersStore.getState().expandFolder('a');
    expect(useFoldersStore.getState().expandedFolderIds.has('a')).toBe(true);
  });
});

describe('setSelectedFolderId', () => {
  it('sets and clears selection', () => {
    useFoldersStore.getState().setSelectedFolderId('a');
    expect(useFoldersStore.getState().selectedFolderId).toBe('a');
    useFoldersStore.getState().setSelectedFolderId(null);
    expect(useFoldersStore.getState().selectedFolderId).toBeNull();
  });
});
