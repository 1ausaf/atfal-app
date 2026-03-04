-- Daily login points: store 50 (daily) or 1050 (daily + 7-day streak bonus) per login row
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS points_awarded INTEGER NOT NULL DEFAULT 0;

-- Track consecutive login days for streak bonus (Tifls only, used in auth)
CREATE TABLE IF NOT EXISTS login_streak (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_activity_date DATE NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_login_streak_user ON login_streak(user_id);
ALTER TABLE login_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon login_streak" ON login_streak FOR ALL USING (false);

-- Leaderboard: include login points in total
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.age,
  u.age_group,
  u.majlis_id,
  (
    COALESCE(hw.points, 0)::integer
    + COALESCE(ls.points, 0)::integer
    + COALESCE(u.manual_points, 0)
    + COALESCE(login_pts.points, 0)::integer
  ) AS total_points
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
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS points
  FROM activity_log
  WHERE activity_type = 'login'
  GROUP BY user_id
) login_pts ON u.id = login_pts.user_id
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;
