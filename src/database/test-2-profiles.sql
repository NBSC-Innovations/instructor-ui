-- TEST 2: Check if we can query profiles
SELECT 'TEST 2' as step, 'Can query profiles' as message, COUNT(*) as profile_count
FROM public.profiles;
