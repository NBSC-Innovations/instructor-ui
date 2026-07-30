-- Fix RLS policy violation for gc_messages
-- This assigns the instructor to the specific course causing the error

-- Update the specific course to have the correct instructor_id
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';

-- Verify the update
SELECT id, code, title, instructor_id 
FROM public.courses 
WHERE id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';

-- Also update the corresponding section
UPDATE public.sections 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE course_id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';

-- Verify sections update
SELECT id, name, description, instructor_id, course_id 
FROM public.sections 
WHERE course_id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';
