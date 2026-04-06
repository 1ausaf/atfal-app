-- Backfill season2_points so active-season Majlis progress reflects
-- historical graded lesson submissions from this same season.
-- Rule: only lessons created on/after the active season start are counted.

WITH active AS (
  SELECT id, starts_at
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
)
UPDATE users u
SET season2_points = 0,
    updated_at = now()
WHERE u.role = 'tifl'
  AND u.deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM active);

WITH active AS (
  SELECT id, starts_at
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
),
season2_lesson_points AS (
  SELECT
    ls.user_id,
    COALESCE(SUM(ls.points_awarded), 0)::integer AS pts
  FROM lesson_submissions ls
  JOIN lesson_activities la ON la.id = ls.activity_id
  JOIN active a ON true
  WHERE ls.status = 'graded'
    AND la.created_at >= a.starts_at
  GROUP BY ls.user_id
)
UPDATE users u
SET season2_points = s.pts,
    updated_at = now()
FROM season2_lesson_points s
WHERE u.id = s.user_id
  AND u.role = 'tifl'
  AND u.deleted_at IS NULL;
