-- Get the current auth user ID for instructor@nbsc.edu.ph
SELECT id, email FROM auth.users WHERE email = 'instructor@nbsc.edu.ph';

-- Get the current profile ID for instructor@nbsc.edu.ph
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';

-- Update the profile ID to match the auth user ID
-- Replace 'ACTUAL_AUTH_USER_ID' with the ID from the first query
UPDATE public.profiles 
SET id = 'ACTUAL_AUTH_USER_ID'
WHERE email = 'instructor@nbsc.edu.ph';

-- Verify the update
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';
