-- Daily crossword puzzles (JSON definition) + leaderboard + majlis ledger support.

CREATE TABLE crossword_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  puzzle_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crossword_puzzles_created_at ON crossword_puzzles(created_at);

ALTER TABLE crossword_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon crossword_puzzles" ON crossword_puzzles FOR ALL USING (false);

-- Allow crossword events in majlis competition ledger
ALTER TABLE majlis_competition_ledger
  DROP CONSTRAINT IF EXISTS majlis_competition_ledger_event_type_check;

ALTER TABLE majlis_competition_ledger
  ADD CONSTRAINT majlis_competition_ledger_event_type_check
  CHECK (event_type IN ('login', 'wordle', 'crossword', 'homework', 'lesson', 'manual'));

-- Leaderboard: include crossword activity_log points (OR REPLACE avoids DROP; majlis_competition_progress_current depends on leaderboard)
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
  (
    COALESCE(hw.points, 0)::integer
    + COALESCE(ls.points, 0)::integer
    + COALESCE(u.manual_points, 0)
    + COALESCE(login_pts.points, 0)::integer
    + COALESCE(wordle_pts.points, 0)::integer
    + COALESCE(crossword_pts.points, 0)::integer
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

-- Minimal seed so the feature works before Regional adds puzzles (1-across word).
INSERT INTO crossword_puzzles (title, puzzle_json)
VALUES (
  'Starter',
  '{
    "rows": 1,
    "cols": 5,
    "solution": [["H","E","L","L","O"]],
    "clues": {
      "across": [{"n": 1, "clue": "A friendly greeting", "row": 0, "col": 0, "len": 5}],
      "down": []
    }
  }'::jsonb
);
