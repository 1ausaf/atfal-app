-- Fix Majlis progress showing 0 when ledger is empty.
-- Compute current progress from each tifl's points + homework points,
-- then apply the Majlis coefficient for fairness.

CREATE OR REPLACE VIEW majlis_competition_progress_current AS
WITH active AS (
  SELECT id, goal_points, prize
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
),
hw_points_by_user AS (
  SELECT hs.user_id, COALESCE(SUM(hs.points_awarded), 0)::numeric(12,2) AS hw_points
  FROM homework_submissions hs
  WHERE hs.status = 'approved'
  GROUP BY hs.user_id
),
points_by_user AS (
  SELECT
    lb.id AS user_id,
    lb.majlis_id,
    COALESCE(lb.total_points, 0)::numeric(12,2) AS total_points,
    COALESCE(hw.hw_points, 0)::numeric(12,2) AS hw_points
  FROM leaderboard lb
  LEFT JOIN hw_points_by_user hw ON hw.user_id = lb.id
)
SELECT
  m.id AS majlis_id,
  m.name AS majlis_name,
  a.id AS season_id,
  a.goal_points,
  a.prize,
  COALESCE(
    SUM(
      (
        (0.5 * p.total_points) + (0.5 * p.hw_points)
      ) * COALESCE(c.coefficient, 0)
    ),
    0
  )::numeric(12,2) AS normalized_points,
  CASE
    WHEN COALESCE(a.goal_points, 0) <= 0 THEN 0
    ELSE ROUND(
      (
        COALESCE(
          SUM(
            (
              (0.5 * p.total_points) + (0.5 * p.hw_points)
            ) * COALESCE(c.coefficient, 0)
          ),
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

