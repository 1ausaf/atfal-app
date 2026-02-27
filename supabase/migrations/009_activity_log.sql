CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date, activity_type)
);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon activity_log" ON activity_log FOR ALL USING (false);
