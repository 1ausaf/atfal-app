-- Salat: dual pass (Arabic only / Arabic with Translation) and Salat Star badge
ALTER TABLE salat_progress
  ADD COLUMN IF NOT EXISTS passed_arabic BOOLEAN,
  ADD COLUMN IF NOT EXISTS passed_translation BOOLEAN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS salat_star BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing passed = passed_arabic true; existing superstars get passed_translation true on all passed rows
UPDATE salat_progress SET passed_arabic = true WHERE status = 'passed';
UPDATE salat_progress sp
SET passed_translation = true
FROM users u
WHERE sp.user_id = u.id AND u.salat_superstar = true AND sp.status = 'passed';

-- Set salat_star for users with all 14 categories passed_arabic
UPDATE users u
SET salat_star = true
FROM (
  SELECT user_id FROM salat_progress WHERE passed_arabic = true GROUP BY user_id HAVING COUNT(*) = 14
) s
WHERE u.id = s.user_id;
