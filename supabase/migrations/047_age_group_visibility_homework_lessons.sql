-- Age-group audience targeting for homework and lessons.
ALTER TABLE homework
  ADD COLUMN IF NOT EXISTS target_age_groups TEXT[] NOT NULL DEFAULT ARRAY['all']::text[];

ALTER TABLE lesson_activities
  ADD COLUMN IF NOT EXISTS target_age_groups TEXT[] NOT NULL DEFAULT ARRAY['all']::text[];

UPDATE homework
SET target_age_groups = ARRAY['all']::text[]
WHERE target_age_groups IS NULL OR array_length(target_age_groups, 1) IS NULL;

UPDATE lesson_activities
SET target_age_groups = ARRAY['all']::text[]
WHERE target_age_groups IS NULL OR array_length(target_age_groups, 1) IS NULL;

ALTER TABLE homework
  DROP CONSTRAINT IF EXISTS homework_target_age_groups_valid;
ALTER TABLE homework
  ADD CONSTRAINT homework_target_age_groups_valid
  CHECK (
    target_age_groups IS NOT NULL
    AND array_length(target_age_groups, 1) >= 1
    AND target_age_groups <@ ARRAY['all','7-9','10-11','12-14']::text[]
    AND (NOT ('all' = ANY(target_age_groups)) OR array_length(target_age_groups, 1) = 1)
  );

ALTER TABLE lesson_activities
  DROP CONSTRAINT IF EXISTS lesson_activities_target_age_groups_valid;
ALTER TABLE lesson_activities
  ADD CONSTRAINT lesson_activities_target_age_groups_valid
  CHECK (
    target_age_groups IS NOT NULL
    AND array_length(target_age_groups, 1) >= 1
    AND target_age_groups <@ ARRAY['all','7-9','10-11','12-14']::text[]
    AND (NOT ('all' = ANY(target_age_groups)) OR array_length(target_age_groups, 1) = 1)
  );

CREATE INDEX IF NOT EXISTS idx_homework_target_age_groups_gin
ON homework USING GIN (target_age_groups);

CREATE INDEX IF NOT EXISTS idx_lesson_activities_target_age_groups_gin
ON lesson_activities USING GIN (target_age_groups);
