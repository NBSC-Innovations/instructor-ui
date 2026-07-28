-- ============================================
-- SEQUENTIAL TRIGGER TEST (no DO blocks)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create a test user directly
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test-sequential@example.com',
  crypt('testpassword', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test Sequential"}'::jsonb
);

-- Step 2: Check if auth user was created
SELECT 'AUTH USER' as step, id, email 
FROM auth.users 
WHERE email = 'test-sequential@example.com';

-- Step 3: Check if profile was created by trigger
SELECT 'PROFILE' as step, id, email, full_name, role
FROM public.profiles 
WHERE email = 'test-sequential@example.com';

-- Step 4: Test result
SELECT 'RESULT' as step, 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'test-sequential@example.com') 
    THEN 'SUCCESS: Trigger worked'
    ELSE 'FAILURE: Trigger failed'
  END as result;

-- Step 5: Cleanup
DELETE FROM auth.users WHERE email = 'test-sequential@example.com';
DELETE FROM public.profiles WHERE email = 'test-sequential@example.com';

SELECT 'DONE' as step, 'Cleanup complete' as message;
