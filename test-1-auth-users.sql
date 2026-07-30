-- TEST 1: Check if we can query auth.users
SELECT 'TEST 1' as step, 'Can query auth.users' as message, COUNT(*) as user_count
FROM auth.users;
