-- Remove Unassigned from Majlis competition entirely
DO $$
DECLARE
  unassigned_id UUID;
BEGIN
  SELECT id INTO unassigned_id FROM majlis WHERE name = 'Unassigned' LIMIT 1;

  IF unassigned_id IS NOT NULL THEN
    DELETE FROM majlis_competition_ledger WHERE majlis_id = unassigned_id;
    DELETE FROM majlis_competition_coefficients WHERE majlis_id = unassigned_id;
  END IF;
END $$;

CREATE OR REPLACE VIEW majlis_competition_progress_current AS
WITH active AS (
  SELECT id, goal_points, prize
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
)
SELECT
  m.id AS majlis_id,
  m.name AS majlis_name,
  a.id AS season_id,
  a.goal_points,
  a.prize,
  COALESCE(SUM(l.normalized_points), 0)::numeric(12,2) AS normalized_points,
  CASE
    WHEN COALESCE(a.goal_points, 0) <= 0 THEN 0
    ELSE ROUND((COALESCE(SUM(l.normalized_points), 0) / a.goal_points) * 100, 2)
  END AS progress_pct
FROM active a
CROSS JOIN majlis m
LEFT JOIN majlis_competition_ledger l ON l.season_id = a.id AND l.majlis_id = m.id
WHERE m.name <> 'Unassigned'
GROUP BY m.id, m.name, a.id, a.goal_points, a.prize;
