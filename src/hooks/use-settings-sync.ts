'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import type { SettingsJson } from '@/stores/settings-store';
import type { Theme } from '@/types';
import type { Json } from '@/lib/supabase/types';

const DEBOUNCE_MS = 1000;

export function useSettingsSync() {
  const didLoad = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    const supabase = createClient();

    async function loadFromDb() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // No row exists yet — seed from current localStorage state
        const settings = useSettingsStore.getState();
        const theme = useUIStore.getState().theme;
        const json = settings._toJson(theme);

        await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, settings: json as unknown as Json, updated_at: new Date().toISOString() });
        return;
      }

      // DB row exists — apply to local state
      const json = data.settings as unknown as SettingsJson;
      if (json) {
        useSettingsStore.getState()._loadFromJson(json);
        // Sync theme to UI store
        if (json.theme) {
          useUIStore.getState().setTheme(json.theme as Theme);
        }
      }
    }

    loadFromDb();
  }, []);

  // Subscribe to settings changes and sync to DB
  useEffect(() => {
    const unsubSettings = useSettingsStore.subscribe(() => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const theme = useUIStore.getState().theme;
        const json = useSettingsStore.getState()._toJson(theme);

        await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, settings: json as unknown as Json, updated_at: new Date().toISOString() });
      }, DEBOUNCE_MS);
    });

    const unsubTheme = useUIStore.subscribe(
      (state, prevState) => {
        if (state.theme !== prevState.theme) {
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const theme = useUIStore.getState().theme;
            const json = useSettingsStore.getState()._toJson(theme);

            await supabase
              .from('user_settings')
              .upsert({ user_id: user.id, settings: json as unknown as Json, updated_at: new Date().toISOString() });
          }, DEBOUNCE_MS);
        }
      }
    );

    return () => {
      unsubSettings();
      unsubTheme();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);
}
