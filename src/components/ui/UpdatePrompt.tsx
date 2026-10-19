'use client';

import { useEffect, useState } from 'react';
import { flushPendingSaves } from '@/hooks/use-note-autosave';

/**
 * An installed PWA keeps running old code until it's fully closed. This checks for a new
 * service worker whenever the app comes back to the foreground and offers a reload once
 * the new version has taken over.
 */
export function UpdatePrompt() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    // The very first install also fires controllerchange; that isn't an update.
    const hadController = !!sw.controller;
    const onControllerChange = () => {
      if (hadController) setReady(true);
    };
    const checkForUpdate = () => {
      if (document.visibilityState !== 'visible') return;
      sw.getRegistration().then((reg) => reg?.update()).catch(() => {});
    };
    sw.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', checkForUpdate);
    return () => {
      sw.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, []);

  if (!ready) return null;

  async function reload() {
    await flushPendingSaves();
    window.location.reload();
  }

  return (
    <div className="fixed inset-x-4 top-3 z-50 flex justify-center">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 shadow-md">
        <p className="flex-1 text-sm text-text-secondary">Update ready</p>
        <button onClick={reload} className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent-hover">
          Reload
        </button>
        <button onClick={() => setReady(false)} className="text-sm text-text-muted hover:text-text-secondary" aria-label="Later">
          Later
        </button>
      </div>
    </div>
  );
}
