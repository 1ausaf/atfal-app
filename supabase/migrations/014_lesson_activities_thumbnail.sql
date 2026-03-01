-- Add optional thumbnail for lesson activities (e.g. PNG upload, max 2MB via app)
ALTER TABLE lesson_activities
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
