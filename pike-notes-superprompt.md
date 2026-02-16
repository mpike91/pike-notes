# Pike Notes — Claude CLI Super-Prompt

You are building **Pike Notes**, a personal note-taking and to-do app. Think Simplenotes meets Google Keep — simple, fast, elegant, and synced everywhere. This is a personal-use app (not a commercial product), but it should feel polished and professional.

---

## 🧭 CRITICAL: Planning-First Workflow

**You MUST plan before writing any code.** Follow this workflow strictly:

### Phase 1: Plan
1. Read this entire prompt carefully.
2. Produce a detailed `PLAN.md` in the project root that includes:
   - **Architecture diagram** (text-based) showing how all pieces connect
   - **File/folder structure** for the entire project
   - **Data model** with exact Supabase table schemas, indexes, and RLS policies
   - **Component tree** showing the React component hierarchy
   - **State management strategy** (what lives where: server state, local state, optimistic updates)
   - **Sync strategy** detailing how realtime sync works, conflict resolution, and offline behavior
   - **PWA strategy** covering service worker scope, caching strategy, and install flow
   - **Phase breakdown** splitting work into logical, testable milestones
3. **Stop and wait for approval** of the plan before proceeding to Phase 2.

### Phase 2: Execute
- Build phase by phase per the approved plan.
- After completing each phase, briefly summarize what was built and confirm it's working before moving on.
- Commit logically (one commit per meaningful unit of work, not one giant commit).

---

## 🏗️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 14+ (App Router) | Use Server Components where sensible, Client Components for interactive pieces |
| **Language** | TypeScript (strict mode) | No `any` types. Prefer explicit typing. |
| **Styling** | Tailwind CSS + CSS variables for theming | CSS variables enable runtime theme switching without re-renders |
| **Backend/DB** | Supabase (Postgres + Realtime + Auth) | Hosted Supabase (free tier) |
| **Auth** | Supabase Auth (email/password) | Single-user for now, but schema is multi-user-ready (every table has `user_id`) |
| **Hosting** | Vercel | Automatic deployments from Git |
| **PWA** | next-pwa or Serwist | Service worker for offline support + installability |

---

## 📐 Data Model

Design the schema to be multi-user-ready from day one even though there's currently one user. Every table gets a `user_id` column with RLS policies.

### Core Tables

#### `notes`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES auth.users(id) NOT NULL
title           TEXT DEFAULT ''
content         TEXT DEFAULT ''
note_type       TEXT DEFAULT 'note'  -- 'note' | 'todo'
is_pinned       BOOLEAN DEFAULT false
is_archived     BOOLEAN DEFAULT false
is_trashed      BOOLEAN DEFAULT false
trashed_at      TIMESTAMPTZ  -- for auto-delete after 30 days
color           TEXT DEFAULT 'default'  -- for optional note coloring
sort_order       FLOAT  -- for manual ordering; use fractional indexing
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `todo_items`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
note_id         UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL
user_id         UUID REFERENCES auth.users(id) NOT NULL
content         TEXT NOT NULL
is_completed    BOOLEAN DEFAULT false
completed_at    TIMESTAMPTZ
priority        INTEGER DEFAULT 2  -- 1 = high, 2 = medium, 3 = low (3-tier hierarchy)
sort_order       FLOAT
due_at          TIMESTAMPTZ  -- optional due date/time
reminder_at     TIMESTAMPTZ  -- optional reminder time
snooze_until    TIMESTAMPTZ  -- snoozed notifications
do_not_notify   TEXT  -- 'today' | 'week' | 'month' | 'year' | null
notify_on_location JSONB  -- { lat, lng, radius, label } for geo-fencing (future)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `tags` and `note_tags` (for future use, include in schema now)
```
-- tags
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES auth.users(id) NOT NULL
name            TEXT NOT NULL
color           TEXT DEFAULT 'default'
created_at      TIMESTAMPTZ DEFAULT now()

-- note_tags (junction)
note_id         UUID REFERENCES notes(id) ON DELETE CASCADE
tag_id          UUID REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (note_id, tag_id)
```

### RLS Policies
- Every table: `USING (auth.uid() = user_id)` for SELECT, UPDATE, DELETE
- Every table: `WITH CHECK (auth.uid() = user_id)` for INSERT
- Enable RLS on all tables
- Enable Realtime on `notes` and `todo_items` tables

### Indexes
- `notes`: index on `(user_id, is_trashed, is_archived, updated_at DESC)`
- `todo_items`: index on `(note_id)`, index on `(user_id, due_at)`, index on `(user_id, reminder_at)`

### Database Triggers
- Auto-update `updated_at` on every row modification for `notes` and `todo_items`
- Auto-set `trashed_at` when `is_trashed` transitions to `true`

---

## 🎨 Design & Theming

### Design Philosophy
- **Simplenotes-inspired**: Typography-forward, generous whitespace, minimal chrome
- **Performance-first aesthetics**: No gratuitous animations. Every visual element earns its place.
- **Quiet confidence**: The app should feel calm, fast, and trustworthy — not flashy
- **Polished touches**: Subtle transitions (150-200ms), smooth state changes, micro-interactions that feel native
- Avoid heavy shadows, gradients, or "glassy" effects. Prefer clean lines, clear hierarchy, and breathing room.

### Theme System (3 Themes)
Use CSS custom properties on `:root` / `[data-theme="..."]` for instant switching with zero re-renders.

1. **Light** — Clean white/near-white background, dark text, subtle warm gray accents
2. **Dark (Gray)** — True dark mode. Near-black background (#1a1a1a range), light text, muted gray accents
3. **Dark (Slate)** — Cooler dark mode. Slate/blue-gray background (#1e293b range), slightly cooler text tones

Each theme defines at minimum:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border`, `--border-subtle`
- `--accent`, `--accent-hover`
- `--surface` (cards, note backgrounds)
- `--danger`, `--success`, `--warning`

Store theme preference in `localStorage` and apply before first paint (use a blocking `<script>` in `<head>` to prevent flash).

### Typography
- Use a clean system font stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Load Inter from Google Fonts (with `font-display: swap`)
- Note content: 15-16px base, comfortable line-height (1.6-1.7)
- UI chrome: 13-14px
- Clear typographic hierarchy: title > content preview > metadata

### Layout
- **Sidebar + Main Content** on desktop (sidebar collapsible)
- **Single-pane with navigation** on mobile (bottom nav or swipe-based)
- The note list should feel like a fast, scannable feed — not a dense table
- Each note card in the list: title, first ~2 lines of content preview, last-edited timestamp, pinned indicator, todo progress if applicable

---

## ✏️ Editor

### Core Editor Behavior
- The editor should be **fast and distraction-free**
- Plain text by default. No rich-text toolbar cluttering the UI.
- Consider using a lightweight editor foundation like CodeMirror 6 or a custom `contentEditable` wrapper — NOT a heavy WYSIWYG like TipTap/ProseMirror unless there's a compelling reason. Weight matters.
- Auto-save on change (debounced ~800ms-1s). No save button. Content is always persisted.
- Show a subtle "Saving..." / "Saved" indicator (unobtrusive, e.g., small text near the title or a dot in the header)

### Focus Mode
- A toggle (keyboard shortcut + UI button) that:
  - Hides the sidebar and all navigation
  - Centers the note content in the viewport with comfortable max-width (~680px)
  - Dims or removes all UI chrome except a minimal "exit focus" control
  - Optional: slight background dim or vignette to further reduce distraction
  - Keyboard shortcut: `Escape` to exit, `Ctrl+Shift+F` (or similar) to enter

### Required Keyboard Shortcuts
Implement these from day one. Use a clean, extensible shortcut system (a hook or registry pattern) so adding new shortcuts later is trivial.

| Shortcut | Action |
|----------|--------|
| `Ctrl+X` (nothing selected) | Cut entire current line |
| `Tab` | Insert indentation (2 or 4 spaces, configurable) — do NOT move focus |
| `Shift+Tab` | Dedent current line |
| `Alt+Up` | Move current line up |
| `Alt+Down` | Move current line down |
| `Ctrl+Shift+F` | Toggle Focus Mode |
| `Ctrl+N` | New note |
| `Ctrl+K` | Quick search / command palette |
| `Ctrl+S` | Force save (even though auto-save handles it — muscle memory matters) |

The shortcut system should be a simple registry, something like:
```typescript
// Conceptual — implement as makes sense
registerShortcut({
  key: 'x',
  ctrl: true,
  when: 'editor.nothingSelected',
  action: 'editor.cutLine',
});
```
This makes future shortcut additions a one-liner.

---

## 🔄 Sync Strategy

Sync is **the most critical feature**. A note-taking app that loses data or feels laggy on sync is a failed note-taking app.

### Architecture
1. **Optimistic updates**: All changes are applied to local state immediately. The UI never waits for the server.
2. **Debounced persistence**: After 800ms-1s of inactivity, flush changes to Supabase.
3. **Supabase Realtime**: Subscribe to changes on `notes` and `todo_items` tables. When a change arrives from the server that differs from local state, merge intelligently (last-write-wins is acceptable for a single-user app, but handle it gracefully).
4. **Offline support**: 
   - Use the service worker to cache the app shell and static assets.
   - Queue writes in IndexedDB when offline.
   - On reconnection, flush the queue to Supabase.
   - Show a clear but non-intrusive offline indicator.
5. **Conflict resolution**: For a single-user app, last-write-wins with `updated_at` comparison is fine. If two devices edit the same note, the most recent edit wins. We're not building Google Docs-level CRDT here — keep it simple.

### What "syncs well" means
- Open note on phone, edit on laptop → phone sees update within 1-2 seconds
- Edit offline on phone, go online → changes persist without manual intervention
- No data loss, ever. Defensive coding around sync edge cases.

---

## 📱 PWA & Mobile

### PWA Requirements
- Valid `manifest.json` with app name "Pike Notes", appropriate icons (at least 192px and 512px), `display: standalone`, theme colors matching the active theme
- Service worker that caches:
  - App shell (HTML, JS, CSS) — cache-first strategy
  - API responses — network-first with cache fallback
  - Images/icons — cache-first with long TTL
- `beforeinstallprompt` handling: show a subtle, non-annoying install prompt (maybe a small banner that can be dismissed and remembered)
- Offline page: If the app shell can't load, show a branded offline page

### Mobile UX
- Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- On mobile:
  - Note list is full-screen. Tapping a note navigates to the editor view (not a split pane).
  - Back navigation is intuitive (swipe or back button)
  - Bottom navigation bar with: Notes, Todos, Search, Settings
  - Touch targets are at least 44x44px
  - No hover-dependent interactions
- Test that `Tab` key behavior works correctly on mobile virtual keyboards (it shouldn't interfere)

---

## ✅ To-Do Functionality

### Note Types
A note can be either a plain `note` or a `todo`. The type is set at creation and can be toggled.

### Todo Notes
- A todo note has a list of `todo_items` rendered as checkable items
- Each item has:
  - Checkbox (completed state)
  - Content text (editable inline)
  - Priority indicator (visual: e.g., colored dot or icon — P1 red, P2 amber, P3 gray/blue)
  - Optional due date
  - Optional reminder
  - Drag handle for reordering
- Completed items move to a collapsible "Completed" section at the bottom
- Progress indicator on the note card in the list view (e.g., "3/7" or a subtle progress bar)

### 3-Tier Priority System
- **P1 (High)**: Visually prominent — red/warm accent
- **P2 (Medium)**: Default — amber/neutral
- **P3 (Low)**: Subdued — gray or cool accent
- Priority should be quick to set: click/tap the priority dot to cycle, or a small dropdown

---

## 🔔 Notification System (Phase 2 — Build the Foundation Now)

> Full notification implementation is Phase 2, but **design the schema and architecture for it now** so it's not a retrofit.

### Planned Notification Types
1. **Timed reminders**: "Remind me about this todo at 3pm tomorrow"
2. **Random daily nudges**: For active (non-completed, non-snoozed) todos, push a random reminder throughout the day. Frequency weighted by priority (P1 items surface more often). This is a key differentiator — it keeps todos in your face without manual checking.
3. **Location-based** (future/ambitious): Trigger a notification when arriving at a specific location (e.g., "when I get home"). Uses the Geolocation API + geofencing logic. This can be a later phase — just make sure the schema supports it.

### Notification Interaction (for when implemented)
When a notification fires, the user can:
- **Snooze**: Push it back (15min, 1hr, 3hr, tomorrow)
- **Do Not Notify**: Silence for a duration (today / this week / this month / this year)
- **Done**: Mark the todo as completed and archive it

### Architecture Notes for Notifications
- Push notifications require a service worker (already needed for PWA) and the Push API
- For server-triggered notifications (timed reminders, random nudges), you'll need a scheduled job. Options:
  - Vercel Cron Jobs (simple, free tier available)
  - Supabase Edge Functions with pg_cron
- Store push subscription endpoints in a `push_subscriptions` table
- The random nudge system should have configurable "active hours" (e.g., 8am-9pm) and "max notifications per day" settings

---

## 🔍 Search

- **Quick search** (`Ctrl+K`): Opens a command-palette-style modal
  - Searches note titles and content
  - Shows results as-you-type with highlighted matches
  - Can also be used as a command palette (e.g., type ">" to see actions like "New Note", "Toggle Theme", "Toggle Focus Mode")
- **Full-text search**: Use Supabase's `tsvector` / `to_tsquery` for performant server-side search
- **Local search**: Also search cached/local notes for instant results while the server query runs
- Results should show: note title, content snippet with match highlighted, last-edited date

---

## ⚙️ Settings

Keep settings minimal but functional:
- **Theme**: Light / Dark (Gray) / Dark (Slate)
- **Editor**: Tab size (2 or 4 spaces), font size
- **Notifications**: Active hours, max daily nudges, master on/off (Phase 2)
- **Account**: Email display, sign out, export data (JSON dump of all notes)
- **About**: Version, "Pike Notes — a Pike app"

Store settings in a `user_settings` table in Supabase (or just a JSONB column on the user profile) and cache locally.

---

## 🗂️ Navigation & Information Architecture

### Sidebar (Desktop)
- **All Notes** (default view — excludes archived and trashed)
- **Todos** (filtered view: only `note_type = 'todo'`, with sub-grouping by priority or due date)
- **Archive**
- **Trash** (auto-delete after 30 days, show warning)
- **Tags** (expandable, future use)
- Collapsible with a hamburger toggle. Remember collapsed state.

### Note Actions
- Pin / Unpin
- Archive / Unarchive
- Move to Trash / Restore from Trash
- Permanently Delete (from Trash only, with confirmation)
- Change note type (note ↔ todo)
- Duplicate
- Copy to clipboard (plain text)
- Share (future — generate a read-only link)

---

## 🏎️ Performance Requirements

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse PWA score**: 90+
- **Bundle size**: Watch it. Use dynamic imports for anything not needed on first load (settings panel, search modal, etc.)
- **No layout shift**: Reserve space for dynamic content. Use skeleton loaders if data isn't instant.
- **Debounce everything**: Search input, auto-save, sync — never spam the server.
- Supabase queries should be indexed and fast. Test with 1000+ notes to ensure the app stays snappy.

---

## 📁 Project Structure (Suggested)

```
pike-notes/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── offline.html
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   ├── page.tsx            # Main app page (redirect to /notes or render directly)
│   │   ├── login/
│   │   └── (app)/              # Authenticated route group
│   │       ├── layout.tsx      # App shell (sidebar + main)
│   │       ├── notes/
│   │       └── settings/
│   ├── components/
│   │   ├── ui/                 # Generic UI primitives (Button, Modal, etc.)
│   │   ├── notes/              # Note-specific components
│   │   ├── todos/              # Todo-specific components
│   │   ├── editor/             # Editor component + shortcut system
│   │   ├── search/             # Search modal / command palette
│   │   └── layout/             # Sidebar, Header, MobileNav
│   ├── hooks/                  # Custom hooks (useNotes, useSync, useShortcuts, etc.)
│   ├── lib/
│   │   ├── supabase/           # Supabase client, helpers, types
│   │   ├── sync/               # Sync engine, offline queue, conflict resolution
│   │   ├── shortcuts/          # Shortcut registry
│   │   └── utils/              # General utilities
│   ├── stores/                 # Zustand or similar state stores
│   ├── styles/
│   │   ├── globals.css         # Theme CSS variables, base styles
│   │   └── themes/             # Theme definitions
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── migrations/             # SQL migration files
│   └── seed.sql                # Optional seed data
├── PLAN.md                     # Your architecture plan (created in Phase 1)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚫 Anti-Patterns to Avoid

- **No feature creep**: If it's not in this spec, don't build it. Keep it simple.
- **No rich-text editor overhead**: This is a plain-text / markdown-light app, not Notion.
- **No premature abstraction**: Don't build a plugin system. Don't over-engineer the theme engine. Solve the concrete problem.
- **No server-side rendering for the app shell**: The authenticated app is a client-rendered SPA within the Next.js framework. SSR adds complexity for no gain in a personal app behind auth.
- **No Redux or heavy state management**: Zustand or Jotai for global state, React state/context for local. Keep it light.
- **No loading spinners on every interaction**: Use optimistic updates and skeleton UI. The app should feel instant.

---

## ✅ Definition of Done (Phase 1 — MVP)

Phase 1 is complete when:
- [ ] User can sign in (email/password)
- [ ] User can create, edit, delete, archive, pin, and trash notes
- [ ] Editor auto-saves with debounce
- [ ] All keyboard shortcuts listed above work correctly
- [ ] Focus Mode works
- [ ] 3 themes implemented and switchable at runtime (no flash on load)
- [ ] Responsive: works well on desktop and mobile-sized screens
- [ ] PWA: installable, works offline (read-only at minimum), syncs on reconnect
- [ ] Realtime sync between devices (open in two browser tabs to test)
- [ ] Search works (at minimum: client-side filtering; ideally: full-text via Supabase)
- [ ] Todo note type with checkable items and 3-tier priority
- [ ] Settings page with theme selection and basic preferences
- [ ] Clean, polished UI that I'd enjoy using daily
- [ ] Performance meets requirements above
- [ ] Deployed to Vercel and accessible from phone and laptop

---

## 💬 Communication Style

- Be direct. Tell me what you're building and why.
- If you see a better approach than what I've specified, suggest it with reasoning — but don't deviate without asking.
- If something in this spec is ambiguous, ask before assuming.
- Keep commit messages clear and descriptive.
- After each phase, give me a brief status update: what's done, what's next, any blockers or decisions needed.

---

*Pike Notes — a Pike app. Simple. Fast. Synced. Mine.*
