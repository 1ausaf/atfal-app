-- Goals: add optional due date (be done by)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS due_date DATE;
