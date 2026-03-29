-- Add reversible tifl ban fields.
-- Ban is separate from soft-delete (deleted_at).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_banned_by_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_banned_by_fkey
      FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_banned_at ON users(banned_at);
