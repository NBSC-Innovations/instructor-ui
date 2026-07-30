-- Fix instructor course assignment for RLS policy
-- This ensures the instructor is properly set as the instructor_id in courses table
-- Instructor ID: 85d974f0-b319-4ea5-aba2-c2db0b57c35e

-- Update courses to have the correct instructor_id
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id IS NULL OR instructor_id != '85d974f0-b319-4ea5-aba2-c2db0b57c35e';

-- Verify the update
SELECT id, code, title, instructor_id FROM public.courses WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';

-- Also update sections to have the correct instructor_id
UPDATE public.sections 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE instructor_id IS NULL OR instructor_id != '85d974f0-b319-4ea5-aba2-c2db0b57c35e';

-- Verify sections update
SELECT id, name, description, instructor_id FROM public.sections WHERE instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e';
