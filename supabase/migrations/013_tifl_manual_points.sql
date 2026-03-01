-- Manual points nazims can add/remove for a tifl; included in leaderboard total
ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_points INTEGER NOT NULL DEFAULT 0;

-- Recreate leaderboard view to include manual_points in total
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.age,
  u.age_group,
  u.majlis_id,
  (COALESCE(hw.points, 0)::integer + COALESCE(ls.points, 0)::integer + COALESCE(u.manual_points, 0)) AS total_points
FROM users u
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS points
  FROM homework_submissions
  WHERE status = 'approved'
  GROUP BY user_id
) hw ON u.id = hw.user_id
LEFT JOIN (
  SELECT user_id, SUM(points_awarded)::integer AS points
  FROM lesson_submissions
  WHERE status = 'graded'
  GROUP BY user_id
) ls ON u.id = ls.user_id
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;
