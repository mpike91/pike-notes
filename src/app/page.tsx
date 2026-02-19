'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pike-notes-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.homeNoteId) {
          router.replace(`/notes/${parsed.homeNoteId}`);
          return;
        }
      }
    } catch {
      // ignore
    }
    router.replace('/notes');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
