-- Step 1: Update courses to point to the new profile ID
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

-- Step 2: Update sections to point to the new profile ID
UPDATE public.sections 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

-- Step 3: Now update the profile ID
UPDATE public.profiles 
SET id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE email = 'instructor@nbsc.edu.ph';

-- Step 4: Verify all updates
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';
SELECT id, instructor_id FROM public.courses WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
SELECT id, instructor_id FROM public.sections WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
