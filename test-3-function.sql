-- TEST 3: Check if the trigger function exists
SELECT 'TEST 3' as step, 'Trigger function exists' as message, 
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
  THEN 'YES' ELSE 'NO' END as exists;
