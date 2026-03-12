-- Goals can have habits that help achieve them; those habits sync to the habit tracker.
CREATE TABLE goal_habits (
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (goal_id, habit_definition_id)
);

CREATE INDEX idx_goal_habits_goal ON goal_habits(goal_id);
CREATE INDEX idx_goal_habits_habit ON goal_habits(habit_definition_id);

ALTER TABLE goal_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No anon goal_habits" ON goal_habits FOR ALL USING (false);
