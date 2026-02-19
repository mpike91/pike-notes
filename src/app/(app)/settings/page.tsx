'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/ui-store';
import { useSettingsStore } from '@/stores/settings-store';
import { AppHeader } from '@/components/layout/AppHeader';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types';

const themes: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Clean and bright' },
  { value: 'dark-gray', label: 'Dark (Gray)', description: 'Neutral dark mode' },
  { value: 'dark-slate', label: 'Dark (Slate)', description: 'Subtle cool gray' },
  { value: 'dark-wine', label: 'Dark (Wine)', description: 'Warm muted dark' },
  { value: 'dark-moss', label: 'Dark (Moss)', description: 'Earthy muted dark' },
];

const lineSpacingOptions = [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];
const contentWidthOptions: { value: string; label: string }[] = [
  { value: 'null', label: 'Full width' },
  { value: '640', label: '640px' },
  { value: '720', label: '720px' },
  { value: '800', label: '800px' },
  { value: '960', label: '960px' },
];
const fontOptions: { value: string; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'system', label: 'System' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'mono', label: 'Monospace' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();
  const {
    tabSize, fontSize, lineHeight, contentMaxWidth, fontFamily, homeNoteId,
    setTabSize, setFontSize, setLineHeight, setContentMaxWidth, setFontFamily, setHomeNoteId,
  } = useSettingsStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Theme */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">Theme</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    theme === t.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-text-muted'
                  )}
                >
                  <div className="text-sm font-medium text-text-primary">{t.label}</div>
                  <div className="text-xs text-text-muted mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Editor */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">Editor</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Tab size</label>
                <select
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value) as 2 | 4)}
                  className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-sm text-text-primary"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Font size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-sm text-text-primary"
                >
                  {[13, 14, 15, 16, 17, 18].map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Formatting */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">Formatting</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Line spacing</label>
                <select
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-sm text-text-primary"
                >
                  {lineSpacingOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Content width</label>
                <select
                  value={contentMaxWidth === null ? 'null' : String(contentMaxWidth)}
                  onChange={(e) => setContentMaxWidth(e.target.value === 'null' ? null : Number(e.target.value))}
                  className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-sm text-text-primary"
                >
                  {contentWidthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="rounded-md border border-input-border bg-input-bg px-2 py-1 text-sm text-text-primary"
                >
                  {fontOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Home Note */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">Home Note</h2>
            {homeNoteId ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">A home note is set. The app will open to it on launch.</p>
                <button
                  onClick={() => setHomeNoteId(null)}
                  className="shrink-0 rounded-md border border-border px-3 py-1 text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No home note set. Use the note menu to set one.</p>
            )}
          </section>

          {/* About */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">About</h2>
            <p className="text-sm text-text-secondary">PikeNotes — a Pike app</p>
            <p className="text-xs text-text-muted mt-1">Simple. Fast. Synced. Mine.</p>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-sm font-medium text-text-primary mb-3">Account</h2>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
            >
              Sign Out
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
