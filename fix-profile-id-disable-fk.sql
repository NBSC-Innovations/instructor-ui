-- Step 1: Temporarily disable all foreign key constraints that reference profiles
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_instructor_id_fkey;
ALTER TABLE public.group_chat_members DROP CONSTRAINT IF EXISTS group_chat_members_user_id_fkey;
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Step 2: Update the profile ID
UPDATE public.profiles 
SET id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE email = 'instructor@nbsc.edu.ph';

-- Step 3: Update all tables that reference the old profile ID
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

UPDATE public.sections 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

UPDATE public.group_chat_members 
SET user_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE user_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

UPDATE public.enrollments 
SET student_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE student_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

UPDATE public.messages 
SET sender_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE sender_id = 'd11af2b6-3882-462f-9243-d4286d4115b2';

-- Step 4: Re-enable foreign key constraints
ALTER TABLE public.courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sections 
ADD CONSTRAINT sections_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.group_chat_members 
ADD CONSTRAINT group_chat_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 5: Verify all updates
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'instructor@nbsc.edu.ph';
SELECT id, instructor_id FROM public.courses WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
SELECT id, instructor_id FROM public.sections WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
SELECT id, user_id FROM public.group_chat_members WHERE user_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
