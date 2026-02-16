'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

interface FocusModeProps {
  children: React.ReactNode;
}

export function FocusMode({ children }: FocusModeProps) {
  const { focusModeActive, setFocusModeActive } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && focusModeActive) {
        e.preventDefault();
        setFocusModeActive(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusModeActive, setFocusModeActive]);

  if (!focusModeActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-bg-primary">
      <div className="flex h-full w-full max-w-2xl flex-col px-4 py-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setFocusModeActive(false)}
            className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label="Exit focus mode"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
