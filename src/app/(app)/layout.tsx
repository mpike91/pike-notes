'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchModal } from '@/components/search/SearchModal';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { useUIStore } from '@/stores/ui-store';
import { useSync, useOfflineSync } from '@/hooks/use-sync';
import { useOffline } from '@/hooks/use-offline';
import { useGlobalShortcuts, useShortcutListener } from '@/hooks/use-shortcuts';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const focusModeActive = useUIStore((s) => s.focusModeActive);
  const { isOnline } = useOffline();

  // Set up realtime sync and offline queue flushing
  useSync();
  useOfflineSync();

  // Global shortcuts
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const shortcuts = useMemo(() => [
    { key: 'k', ctrl: true, action: openSearch },
  ], [openSearch]);
  useGlobalShortcuts(shortcuts);
  useShortcutListener();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    });
  }, [router]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {!focusModeActive && <Sidebar />}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden',
        !focusModeActive && 'pb-16 md:pb-0'
      )}>
        {/* Offline indicator */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-warning/10 px-3 py-1.5 text-xs text-warning border-b border-warning/20">
            <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            You're offline. Changes will sync when you reconnect.
          </div>
        )}
        {children}
      </main>
      {!focusModeActive && <MobileNav />}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <InstallPrompt />
    </div>
  );
}
