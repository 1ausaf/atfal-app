-- Season 2 split:
-- - all_time points keep growing for incentives
-- - season2_points drive current season rank + majlis progress

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS season2_points INTEGER NOT NULL DEFAULT 0;

-- Reusable all-time points calculation.
CREATE OR REPLACE VIEW tifl_points_all_time AS
SELECT
  u.id AS user_id,
  (
    COALESCE(hw.points, 0)::integer
    + COALESCE(ls.points, 0)::integer
    + COALESCE(u.manual_points, 0)
    + COALESCE(login_pts.points, 0)::integer
    + COALESCE(wordle_pts.points, 0)::integer
    + COALESCE(crossword_pts.points, 0)::integer
  ) AS all_time_points
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
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS points
  FROM activity_log
  WHERE activity_type = 'wordle'
  GROUP BY user_id
) wordle_pts ON u.id = wordle_pts.user_id
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS points
  FROM activity_log
  WHERE activity_type = 'crossword'
  GROUP BY user_id
) crossword_pts ON u.id = crossword_pts.user_id
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;

-- Season-first leaderboard (keep total_points alias for backward compatibility).
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.member_code,
  u.age,
  u.age_group,
  u.majlis_id,
  COALESCE(u.salat_star, false) AS salat_star,
  COALESCE(u.salat_superstar, false) AS salat_superstar,
  COALESCE(at.all_time_points, 0)::integer AS total_points,     -- keep old column in old slot
  COALESCE(u.season2_points, 0)::integer AS season_points,      -- new appended
  COALESCE(at.all_time_points, 0)::integer AS all_time_points   -- new appended
FROM users u
LEFT JOIN tifl_points_all_time at ON at.user_id = u.id
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;

-- Majlis progress follows season2 points only.
CREATE OR REPLACE VIEW majlis_competition_progress_current AS
WITH active AS (
  SELECT id, goal_points, prize
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
),
points_by_user AS (
  SELECT
    u.id AS user_id,
    u.majlis_id,
    COALESCE(u.season2_points, 0)::numeric(12,2) AS season_points
  FROM users u
  WHERE u.role = 'tifl'
    AND u.deleted_at IS NULL
)
SELECT
  m.id AS majlis_id,
  m.name AS majlis_name,
  a.id AS season_id,
  a.goal_points,
  a.prize,
  COALESCE(
    SUM((p.season_points) * COALESCE(c.coefficient, 0)),
    0
  )::numeric(12,2) AS normalized_points,
  CASE
    WHEN COALESCE(a.goal_points, 0) <= 0 THEN 0
    ELSE ROUND(
      (
        COALESCE(
          SUM((p.season_points) * COALESCE(c.coefficient, 0)),
          0
        ) / a.goal_points
      ) * 100,
      2
    )
  END AS progress_pct
FROM active a
CROSS JOIN majlis m
LEFT JOIN majlis_competition_coefficients c
  ON c.season_id = a.id
 AND c.majlis_id = m.id
LEFT JOIN points_by_user p
  ON p.majlis_id = m.id
GROUP BY m.id, m.name, a.id, a.goal_points, a.prize;
