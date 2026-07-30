-- TEST: Insert a test user and check if trigger creates profile
-- Run this in Supabase SQL Editor

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'test-insert@example.com',
  crypt('testpassword', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test Insert"}'::jsonb
);

-- Check if profile was created
SELECT 'PROFILE CHECK' as step, id, email, full_name, role
FROM public.profiles 
WHERE email = 'test-insert@example.com';

-- Cleanup
DELETE FROM auth.users WHERE email = 'test-insert@example.com';
DELETE FROM public.profiles WHERE email = 'test-insert@example.com';
