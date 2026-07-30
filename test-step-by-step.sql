-- ============================================
-- STEP BY STEP TEST - Run each query separately
-- ============================================

-- TEST 1: Check if we can query auth.users
SELECT 'TEST 1' as step, 'Can query auth.users' as message, COUNT(*) as user_count
FROM auth.users;

-- TEST 2: Check if we can query profiles
SELECT 'TEST 2' as step, 'Can query profiles' as message, COUNT(*) as profile_count
FROM public.profiles;

-- TEST 3: Check if the trigger function exists
SELECT 'TEST 3' as step, 'Trigger function exists' as message, 
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
  THEN 'YES' ELSE 'NO' END as exists;

-- TEST 4: Check if the trigger is active
SELECT 'TEST 4' as step, 'Trigger is active' as message,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
  THEN 'YES' ELSE 'NO' END as exists;

-- TEST 5: Try to insert a test user (run this separately)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'test-step@example.com',
--   crypt('testpassword', gen_salt('bf')),
--   NOW(),
--   '{"full_name": "Test Step"}'::jsonb
-- );
