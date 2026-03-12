-- Habit definitions: add is_mandatory for core habits (5 prayers + Reading Quran)
ALTER TABLE habit_definitions ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT false;

-- Mark existing Fajr and Qur'an as mandatory
UPDATE habit_definitions SET is_mandatory = true WHERE slug IN ('fajr_prayer', 'quran_reading');

-- Add Zuhr, Asr, Maghrib, Ishaa as mandatory (insert if not exist)
INSERT INTO habit_definitions (slug, label, icon_name, sort_order, is_mandatory)
VALUES
  ('zuhr_prayer', 'Zuhr Prayer', 'prayer', 2, true),
  ('asr_prayer', 'Asr Prayer', 'prayer', 3, true),
  ('maghrib_prayer', 'Maghrib Prayer', 'prayer', 4, true),
  ('ishaa_prayer', 'Ishaa Prayer', 'prayer', 5, true)
ON CONFLICT (slug) DO UPDATE SET is_mandatory = true, sort_order = EXCLUDED.sort_order;

-- Reorder: mandatory first (1-6), then optional. Set fajr=1, zuhr=2, asr=3, maghrib=4, ishaa=5, quran_reading=6
UPDATE habit_definitions SET sort_order = 1 WHERE slug = 'fajr_prayer';
UPDATE habit_definitions SET sort_order = 2 WHERE slug = 'zuhr_prayer';
UPDATE habit_definitions SET sort_order = 3 WHERE slug = 'asr_prayer';
UPDATE habit_definitions SET sort_order = 4 WHERE slug = 'maghrib_prayer';
UPDATE habit_definitions SET sort_order = 5 WHERE slug = 'ishaa_prayer';
UPDATE habit_definitions SET sort_order = 6 WHERE slug = 'quran_reading';
-- Optional habits after 6
UPDATE habit_definitions SET sort_order = 7 WHERE slug = 'daily_prayers';
UPDATE habit_definitions SET sort_order = 8 WHERE slug = 'memorize_quran';
UPDATE habit_definitions SET sort_order = 9 WHERE slug = 'helping_parents';
UPDATE habit_definitions SET sort_order = 10 WHERE slug = 'kind_to_others';
UPDATE habit_definitions SET sort_order = 11 WHERE slug = 'telling_truth';
UPDATE habit_definitions SET sort_order = 12 WHERE slug = 'exercise';
UPDATE habit_definitions SET sort_order = 13 WHERE slug = 'completing_lessons';
