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
        const uiState = useUIStore.getState();
        const json = settings._toJson(uiState.theme, uiState.accentColor);

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
        // Sync accent color
        useUIStore.getState().setAccentColor(json.accentColor ?? null);
      }
    }

    loadFromDb();
  }, []);

  // Subscribe to settings changes and sync to DB
  useEffect(() => {
    const syncToDb = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const uiState = useUIStore.getState();
        const json = useSettingsStore.getState()._toJson(uiState.theme, uiState.accentColor);

        await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, settings: json as unknown as Json, updated_at: new Date().toISOString() });
      }, DEBOUNCE_MS);
    };

    const unsubSettings = useSettingsStore.subscribe(syncToDb);

    const unsubTheme = useUIStore.subscribe(
      (state, prevState) => {
        if (state.theme !== prevState.theme || state.accentColor !== prevState.accentColor) {
          syncToDb();
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
