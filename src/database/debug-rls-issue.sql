-- Debug RLS policy violation for gc_messages
-- Check the complete chain: sections -> courses -> group_chats

-- 1. Check courses table instructor_id
SELECT id, code, title, instructor_id FROM public.courses;

-- 2. Check sections table with course_id
SELECT id, name, course_id, instructor_id FROM public.sections;

-- 3. Check if sections have valid course_id
SELECT s.id, s.name, s.course_id, c.id as course_exists, c.instructor_id as course_instructor
FROM public.sections s
LEFT JOIN public.courses c ON s.course_id = c.id;

-- 4. Check group_chats
SELECT id, course_id, name FROM public.group_chats;

-- 5. Check if group_chats exist for courses
SELECT c.id as course_id, c.code, c.instructor_id, gc.id as group_chat_id
FROM public.courses c
LEFT JOIN public.group_chats gc ON c.id = gc.course_id;

-- 6. Update courses to have the correct instructor_id
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id IS NULL OR instructor_id != '85d974f0-b319-4ea5-aba2-c2db0b57c35e';

-- 7. Verify courses update
SELECT id, code, title, instructor_id FROM public.courses WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
