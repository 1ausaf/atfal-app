-- Expose member_code in leaderboard view so UI can show username beside name
-- Must DROP then CREATE because REPLACE cannot add a column in the middle (column order/count must match)
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.member_code,
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
