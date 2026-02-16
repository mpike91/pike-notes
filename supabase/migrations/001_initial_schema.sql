-- Pike Notes: Initial Schema
-- Tables: notes, todo_items, tags, note_tags
-- All tables have user_id with RLS policies

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  title           TEXT DEFAULT '',
  content         TEXT DEFAULT '',
  note_type       TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'todo')),
  is_pinned       BOOLEAN DEFAULT false,
  is_archived     BOOLEAN DEFAULT false,
  is_trashed      BOOLEAN DEFAULT false,
  trashed_at      TIMESTAMPTZ,
  color           TEXT DEFAULT 'default',
  sort_order      FLOAT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TODO ITEMS
-- ============================================================
CREATE TABLE todo_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id         UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  content         TEXT NOT NULL,
  is_completed    BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  priority        INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  sort_order      FLOAT,
  due_at          TIMESTAMPTZ,
  reminder_at     TIMESTAMPTZ,
  snooze_until    TIMESTAMPTZ,
  do_not_notify   TEXT CHECK (do_not_notify IN ('today', 'week', 'month', 'year')),
  notify_on_location JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TAGS (for future use)
-- ============================================================
CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  name            TEXT NOT NULL,
  color           TEXT DEFAULT 'default',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTE_TAGS (junction table)
-- ============================================================
CREATE TABLE note_tags (
  note_id         UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id          UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_notes_user_list ON notes (user_id, is_trashed, is_archived, updated_at DESC);
CREATE INDEX idx_notes_user_pinned ON notes (user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_todo_items_note ON todo_items (note_id);
CREATE INDEX idx_todo_items_user_due ON todo_items (user_id, due_at) WHERE due_at IS NOT NULL;
CREATE INDEX idx_todo_items_user_reminder ON todo_items (user_id, reminder_at) WHERE reminder_at IS NOT NULL;
CREATE INDEX idx_tags_user ON tags (user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Todo items policies
CREATE POLICY "Users can view own todo items" ON todo_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todo items" ON todo_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todo items" ON todo_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todo items" ON todo_items
  FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Note_tags: RLS via join to notes (user owns the note)
CREATE POLICY "Users can view own note tags" ON note_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own note tags" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own note tags" ON note_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on notes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER todo_items_updated_at
  BEFORE UPDATE ON todo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set trashed_at when is_trashed transitions to true
CREATE OR REPLACE FUNCTION set_trashed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_trashed = true AND (OLD.is_trashed = false OR OLD.is_trashed IS NULL) THEN
    NEW.trashed_at = now();
  ELSIF NEW.is_trashed = false THEN
    NEW.trashed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_trashed_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION set_trashed_at();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE todo_items;
