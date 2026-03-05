-- Homework: optional release date/time (private until then) and optional link to a lesson.
ALTER TABLE homework
  ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lesson_activity_id UUID REFERENCES lesson_activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_homework_release_at ON homework(release_at);
