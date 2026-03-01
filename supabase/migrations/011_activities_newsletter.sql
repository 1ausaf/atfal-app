-- Newsletter documents for Activities > Read > Newsletter (catalog; document_url opens in new tab)
CREATE TABLE activity_newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  cover_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_newsletter_order ON activity_newsletter("order");
CREATE INDEX idx_activity_newsletter_created_at ON activity_newsletter(created_at DESC);

ALTER TABLE activity_newsletter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon activity_newsletter" ON activity_newsletter FOR ALL USING (false);
