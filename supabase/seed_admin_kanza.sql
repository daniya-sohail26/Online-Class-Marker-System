-- Add Kanza as admin (run in Supabase SQL Editor)
-- Auth user ID: 70ba583c-5b01-4411-8ed6-272ca06eaa1f

INSERT INTO users (auth_id, name, email, role)
VALUES (
  '70ba583c-5b01-4411-8ed6-272ca06eaa1f',
  'Kanza',
  'kanzaakram123@gmail.com',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
