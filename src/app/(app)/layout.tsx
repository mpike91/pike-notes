'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/search/SearchModal';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { useUIStore } from '@/stores/ui-store';
import { useNotesStore } from '@/stores/notes-store';
import { useSync, useOfflineSync } from '@/hooks/use-sync';
import { flushOfflineQueue } from '@/lib/sync/engine';
import { useOffline } from '@/hooks/use-offline';
import { useGlobalShortcuts, useShortcutListener } from '@/hooks/use-shortcuts';
import { useNotes } from '@/hooks/use-notes';
import { useFolders } from '@/hooks/use-folders';
import { useSettingsSync } from '@/hooks/use-settings-sync';
import { DndProvider } from '@/components/dnd/DndProvider';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const focusModeActive = useUIStore((s) => s.focusModeActive);
  const { isOnline } = useOffline();
  const isLoading = useNotesStore((s) => s.isLoading);

  // Pre-fetch all notes + folders into store + refresh on tab focus (multi-device freshness)
  const { fetchNotes } = useNotes();
  const { fetchFolders } = useFolders();
  const refresh = useCallback(() => {
    fetchNotes();
    fetchFolders();
  }, [fetchNotes, fetchFolders]);

  // Set up realtime sync, offline queue flushing, and settings sync
  useSync();
  useOfflineSync(refresh);
  useSettingsSync();
  useEffect(() => {
    if (!isReady) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotes();
        fetchFolders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isReady, fetchNotes, fetchFolders]);

  // Global shortcuts
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const shortcuts = useMemo(() => [
    { key: 'k', ctrl: true, action: openSearch },
  ], [openSearch]);
  useGlobalShortcuts(shortcuts);
  useShortcutListener();

  useEffect(() => {
    const supabase = createClient();
    // getSession reads the local session, so the app still opens offline; RLS guards the data.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setIsReady(true);
      // Queued offline edits go up before the refetch, so the store doesn't show older text.
      if (navigator.onLine) await flushOfflineQueue();
      refresh();
    });
  }, [router, refresh]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <DndProvider>
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        {!focusModeActive && <Sidebar />}
        <main className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !focusModeActive && 'pb-16 md:pb-0'
        )}>
          {/* Loading bar */}
          {isLoading && (
            <div className="h-0.5 w-full overflow-hidden bg-accent/10">
              <div className="h-full w-1/3 bg-accent rounded-full animate-loading-bar" />
            </div>
          )}
          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center justify-center gap-2 bg-warning/10 px-3 py-1.5 text-xs text-warning border-b border-warning/20">
              <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              You're offline. Edits are saved on this device and sync when you reconnect.
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </main>
        {!focusModeActive && <MobileNav />}
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        <InstallPrompt />
      </div>
    </DndProvider>
  );
}
