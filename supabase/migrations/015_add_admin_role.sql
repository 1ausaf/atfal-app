-- Add admin role (same privileges as regional_nazim). Enables creating multiple admins from Manage > Tifls > Create user.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
