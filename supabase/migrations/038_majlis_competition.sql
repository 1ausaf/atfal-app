CREATE TABLE majlis_competition_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal_points NUMERIC(12,2) NOT NULL CHECK (goal_points >= 0),
  prize TEXT NOT NULL DEFAULT 'Majlis Pizza Party',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);

CREATE UNIQUE INDEX uq_majlis_competition_active_season
ON majlis_competition_seasons (is_active)
WHERE is_active = true;

CREATE TABLE majlis_competition_coefficients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES majlis_competition_seasons(id) ON DELETE CASCADE,
  majlis_id UUID NOT NULL REFERENCES majlis(id) ON DELETE CASCADE,
  member_count_snapshot INTEGER NOT NULL CHECK (member_count_snapshot >= 0),
  coefficient NUMERIC(8,4) NOT NULL CHECK (coefficient >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, majlis_id)
);

CREATE INDEX idx_majlis_competition_coefficients_season
ON majlis_competition_coefficients(season_id);

CREATE TABLE majlis_competition_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES majlis_competition_seasons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  majlis_id UUID REFERENCES majlis(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login','wordle','homework','lesson','manual')),
  raw_points NUMERIC(10,2) NOT NULL DEFAULT 0,
  homework_points NUMERIC(10,2) NOT NULL DEFAULT 0,
  weighted_points NUMERIC(10,2) NOT NULL DEFAULT 0,
  coefficient_used NUMERIC(8,4) NOT NULL DEFAULT 0,
  member_count_snapshot INTEGER NOT NULL DEFAULT 0,
  normalized_points NUMERIC(12,2) NOT NULL DEFAULT 0,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_majlis_competition_ledger_season_majlis_time
ON majlis_competition_ledger(season_id, majlis_id, event_at DESC);

CREATE INDEX idx_majlis_competition_ledger_season_time
ON majlis_competition_ledger(season_id, event_at DESC);

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
GROUP BY m.id, m.name, a.id, a.goal_points, a.prize;

ALTER TABLE majlis_competition_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE majlis_competition_coefficients ENABLE ROW LEVEL SECURITY;
ALTER TABLE majlis_competition_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No anon majlis_competition_seasons" ON majlis_competition_seasons FOR ALL USING (false);
CREATE POLICY "No anon majlis_competition_coefficients" ON majlis_competition_coefficients FOR ALL USING (false);
CREATE POLICY "No anon majlis_competition_ledger" ON majlis_competition_ledger FOR ALL USING (false);

INSERT INTO majlis_competition_seasons (name, goal_points, prize, starts_at, ends_at, is_active)
VALUES (
  'Majlis Competition Season 1',
  25000,
  'Majlis Pizza Party',
  now(),
  now() + interval '90 days',
  true
)
ON CONFLICT DO NOTHING;

WITH active AS (
  SELECT id
  FROM majlis_competition_seasons
  WHERE is_active = true
  LIMIT 1
), input_counts AS (
  SELECT * FROM (VALUES
    ('Ahmadiyya Abode of Peace'::text, 19::int),
    ('Emery Village'::text, 14::int),
    ('Rexdale'::text, 33::int),
    ('Weston Islington'::text, 24::int),
    ('Weston North East'::text, 34::int),
    ('Weston North West'::text, 15::int),
    ('Weston South'::text, 33::int)
  ) v(name, member_count)
), avg_count AS (
  SELECT AVG(member_count::numeric) AS value
  FROM input_counts
)
INSERT INTO majlis_competition_coefficients (season_id, majlis_id, member_count_snapshot, coefficient)
SELECT
  a.id,
  m.id,
  i.member_count,
  CASE
    WHEN i.member_count = 0 THEN 0
    ELSE LEAST(1.35, GREATEST(0.65, ROUND((ac.value / i.member_count::numeric), 4)))
  END
FROM active a
JOIN input_counts i ON true
JOIN avg_count ac ON true
JOIN majlis m ON m.name = i.name
ON CONFLICT (season_id, majlis_id)
DO UPDATE SET
  member_count_snapshot = EXCLUDED.member_count_snapshot,
  coefficient = EXCLUDED.coefficient,
  updated_at = now();
