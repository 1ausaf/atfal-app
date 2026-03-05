-- Per-question point value (regional can change); used for auto-grading MC
ALTER TABLE lesson_questions ADD COLUMN IF NOT EXISTS points_value INTEGER NOT NULL DEFAULT 1;

-- Points from auto-graded MC; manual grading adds on top via points_awarded = auto_points + manual_points
ALTER TABLE lesson_submissions ADD COLUMN IF NOT EXISTS auto_points INTEGER NOT NULL DEFAULT 0;
