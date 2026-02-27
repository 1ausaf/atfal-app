-- Add date of birth; age and age_group are computed when DOB is saved
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
