-- Newsletter visibility: null = region-wide (all users); non-null = that majlis only
ALTER TABLE activity_newsletter ADD COLUMN IF NOT EXISTS majlis_id UUID REFERENCES majlis(id);
CREATE INDEX IF NOT EXISTS idx_activity_newsletter_majlis ON activity_newsletter(majlis_id);
