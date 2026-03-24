CREATE TABLE religious_knowledge_checkpoint_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE religious_knowledge_checkpoint_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon religious_knowledge_checkpoint_files"
ON religious_knowledge_checkpoint_files FOR ALL USING (false);
