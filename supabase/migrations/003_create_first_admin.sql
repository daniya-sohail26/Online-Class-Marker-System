-- Create your first admin user
-- 1. In Supabase Dashboard go to Authentication > Users and create a user (or use Sign up in your app).
-- 2. Copy the user's UUID from Authentication > Users.
-- 3. Run this in SQL Editor, replacing YOUR_AUTH_USER_UUID and email/name:

-- INSERT INTO users (auth_id, name, email, role)
-- VALUES (
--   'YOUR_AUTH_USER_UUID',
--   'Admin Name',
--   'admin@yourinstitution.com',
--   'admin'
-- );

-- Example (use real UUID from auth.users):
-- INSERT INTO users (auth_id, name, email, role)
-- SELECT id, COALESCE(raw_user_meta_data->>'name', 'Admin'), email, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@yourinstitution.com'
-- LIMIT 1;
