-- All-time on the leaderboard is Season 1 (locked snapshot) + current season (season2_points).
-- Both update in lockstep as season2_points grows during the active season.

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
  (COALESCE(u.season1_points, 0) + COALESCE(u.season2_points, 0))::integer AS total_points,
  COALESCE(u.season2_points, 0)::integer AS season_points,
  (COALESCE(u.season1_points, 0) + COALESCE(u.season2_points, 0))::integer AS all_time_points
FROM users u
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;
