# Pike Notes

A personal note-taking and to-do PWA. Simplenotes meets Google Keep — fast, syncs everywhere, stays out of your way.

This is a personal-use app I built for myself and use daily. It is not a commercial product, but it is built and maintained as if it were one.

## Features

- **Notes and todos in one app.** Toggle a note's type at any time; todos render as a checkable list with 3-tier priority.
- **Real-time sync across devices** via Supabase Realtime, with optimistic updates so the UI never waits.
- **Offline-first.** Edits queue to IndexedDB while offline and flush on reconnect. No data loss.
- **Installable PWA** with a service worker (Serwist). Add to home screen on phone, run as a desktop app, works offline.
- **Markdown editor** (CodeMirror 6) with shortcuts that match a real text editor: `Tab`/`Shift+Tab` for indent, `Alt+↑`/`Alt+↓` to move lines, `Ctrl+X` to cut a whole line, `Ctrl+Shift+F` for focus mode, `Ctrl+K` for command palette, etc.
- **Three themes** (Light, Dark Gray, Dark Slate) implemented as CSS variables — instant runtime switching, no flash on load.
- **Folders, archive, trash** with 30-day auto-purge.
- **Drag-to-reorder** notes and todo items via `@dnd-kit`.
- **Full-text search** (Postgres `tsvector`) plus instant local filtering against the cached set.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack dev) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS 4 |
| State | Zustand |
| Editor | CodeMirror 6 (`@codemirror/lang-markdown`) |
| Backend | Supabase (Postgres + Auth + Realtime) with row-level security |
| Offline | IndexedDB (`idb-keyval`) for write queue + cache |
| PWA | Serwist service worker |
| Tests | Vitest |

## Architecture highlights

**Sync model.** Every mutation writes to local Zustand state immediately, then debounces a write to Supabase ~800ms later. A Realtime subscription pulls remote changes back. Conflict resolution is last-write-wins on `updated_at` — appropriate for a single-user app, not Google Docs.

**Offline.** When the network drops, writes go into an IndexedDB queue. On reconnect, the queue flushes in order. The app shell, current notes, and assets are cache-first via the service worker.

**Multi-user-ready schema.** Every table has a `user_id` column with RLS policies (`auth.uid() = user_id`) even though the app is single-user today — adding new users is a config change, not a migration.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # next dev --turbopack
```

Apply the migrations in `supabase/migrations/` to your Supabase project before first run.

```bash
npm test          # vitest run
npm run build     # next build
```

## Project layout

```
src/
  app/           # Next.js App Router (auth, app shell, settings)
  components/    # editor, notes, todos, search, layout primitives
  hooks/         # useNotes, useSync, useShortcuts, ...
  lib/           # supabase client, sync engine, shortcut registry, utils
  stores/        # zustand stores
  types/         # shared TS types
supabase/
  migrations/    # 001_initial_schema, 002_folders
```

## Status

In active personal use. Phase 1 (MVP) is complete: notes, todos, sync, offline, themes, PWA, search. Phase 2 (notifications: timed reminders + random nudges weighted by todo priority) is on deck.

— *Pike Notes. Simple. Fast. Synced. Mine.*
