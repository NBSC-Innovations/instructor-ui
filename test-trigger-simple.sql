-- ============================================
-- SIMPLE TRIGGER TEST (returns query results)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create a test user
DO $$
DECLARE
  v_test_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_test_id,
    'test-trigger@example.com',
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    '{"full_name": "Test Trigger"}'::jsonb
  );
  
  -- Store the test ID in a temporary table for retrieval
  CREATE TEMP TABLE IF NOT EXISTS test_user_id (id UUID);
  TRUNCATE test_user_id;
  INSERT INTO test_user_id VALUES (v_test_id);
END $$;

-- Step 2: Check if the test user was created
SELECT 'AUTH USER CREATED' as step, id, email 
FROM auth.users 
WHERE email = 'test-trigger@example.com';

-- Step 3: Check if the profile was created by the trigger
SELECT 'PROFILE CREATED BY TRIGGER' as step, id, email, full_name, role
FROM public.profiles 
WHERE email = 'test-trigger@example.com';

-- Step 4: If profile exists, trigger is working. If not, trigger is failing.
SELECT 'TEST RESULT' as step, 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'test-trigger@example.com') 
    THEN 'SUCCESS: Trigger created profile'
    ELSE 'FAILURE: Trigger did NOT create profile'
  END as result;

-- Step 5: Cleanup
DELETE FROM auth.users WHERE email = 'test-trigger@example.com';
DELETE FROM public.profiles WHERE email = 'test-trigger@example.com';
DROP TABLE IF EXISTS test_user_id;

SELECT 'CLEANUP COMPLETE' as step, 'Test user and profile deleted' as message;
