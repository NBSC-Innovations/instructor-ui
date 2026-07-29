-- Check existing profile for instructor@nbsc.edu.ph
SELECT id, email, full_name, role, student_id FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';

-- If profile exists but has wrong role, update it to instructor
UPDATE public.profiles 
SET role = 'instructor', 
    full_name = 'instructor',
    student_id = NULL
WHERE email = 'instructor@nbsc.edu.ph';

-- Verify the update
SELECT id, email, full_name, role, student_id FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';
