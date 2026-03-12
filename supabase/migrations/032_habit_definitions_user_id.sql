-- Custom habits: belong to a user (user_id set). Global habits have user_id NULL.
ALTER TABLE habit_definitions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_habit_definitions_user ON habit_definitions(user_id);
