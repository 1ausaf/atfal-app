-- Tifl habit selections: each tifl picks up to 5 optional habits to "improve on" (shown in Habits widget with 6 mandatory)
CREATE TABLE tifl_habit_selections (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, habit_definition_id)
);

CREATE INDEX idx_tifl_habit_selections_user ON tifl_habit_selections(user_id);

ALTER TABLE tifl_habit_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon tifl_habit_selections" ON tifl_habit_selections FOR ALL USING (false);
