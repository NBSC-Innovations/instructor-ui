-- Check for auth.users vs profiles ID mismatch
-- This could be causing the RLS policy to fail

-- Check current auth user ID
SELECT auth.uid() as current_auth_uid;

-- Check profile for instructor email
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';

-- Check if there's a mismatch
-- The RLS policy uses auth.uid() to check sender_id and instructor_id
-- If profile.id != auth.uid(), the policy will fail

-- If there's a mismatch, we need to update the auth.users id or the profile id
-- Since we can't easily change auth.users id, we should update the profile to match auth.uid()

-- Get the actual auth user ID for the instructor
SELECT id, email FROM auth.users WHERE email = 'instructor@nbsc.edu.ph';

-- If the IDs don't match, update the profile to match the auth user ID
-- UPDATE public.profiles 
-- SET id = (SELECT id FROM auth.users WHERE email = 'instructor@nbsc.edu.ph')
-- WHERE email = 'instructor@nbsc.edu.ph';
