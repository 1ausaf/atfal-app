-- Season 1 freeze fields for tifls
ALTER TABLE users ADD COLUMN IF NOT EXISTS season1_points INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS season1_player_badge BOOLEAN NOT NULL DEFAULT false;

-- One-time snapshot: lock current leaderboard totals into season1_points.
UPDATE users u
SET season1_points = COALESCE(lb.total_points, 0)
FROM leaderboard lb
WHERE u.id = lb.id
  AND u.role = 'tifl'
  AND u.deleted_at IS NULL;

-- Ensure active tifls with no leaderboard row still get a zero snapshot.
UPDATE users
SET season1_points = 0
WHERE role = 'tifl'
  AND deleted_at IS NULL
  AND season1_points IS NULL;

-- Award Season 1 Player badge to tifls who have logged in at least once.
UPDATE users u
SET season1_player_badge = true
WHERE u.role = 'tifl'
  AND u.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM activity_log a
    WHERE a.user_id = u.id
      AND a.activity_type = 'login'
  );
