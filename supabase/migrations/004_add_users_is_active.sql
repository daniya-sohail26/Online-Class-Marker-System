-- Add is_active to users (run in Supabase SQL Editor if you get "column users.is_active does not exist")
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE users SET is_active = true WHERE is_active IS NULL;
