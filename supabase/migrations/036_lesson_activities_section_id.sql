-- Optional section/category assignment for lesson_activities
ALTER TABLE lesson_activities
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES lesson_sections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_activities_section ON lesson_activities(section_id);

