-- folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Folder',
  sort_order FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add folder_id to notes
ALTER TABLE notes ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_folders_user ON folders (user_id, parent_id, sort_order);
CREATE INDEX idx_notes_folder ON notes (folder_id) WHERE folder_id IS NOT NULL;

-- RLS (same pattern as notes/tags)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE folders;

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
