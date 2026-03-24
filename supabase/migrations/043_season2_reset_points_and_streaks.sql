-- Season 2 reset: clear all live point sources while keeping Season 1 snapshot fields intact.

-- Reset manual adjustments.
UPDATE users
SET manual_points = 0,
    updated_at = now()
WHERE deleted_at IS NULL;

-- Reset awarded points from homework and lessons.
UPDATE homework_submissions
SET points_awarded = 0;

UPDATE lesson_submissions
SET points_awarded = 0;

-- Reset login/wordle/activity points that contribute to leaderboard totals.
UPDATE activity_log
SET points_awarded = 0;

-- Reset login streaks so next login starts at streak 1.
UPDATE login_streak
SET current_streak = 0,
    last_activity_date = DATE '1900-01-01';

-- Reset active majlis competition accumulations for a clean season start.
DELETE FROM majlis_competition_ledger;
