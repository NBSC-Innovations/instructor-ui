-- Step 1: Fix instructor assignment for the course
-- This is required for the RLS policy to work
UPDATE public.courses 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';

-- Also update the corresponding section
UPDATE public.sections 
SET instructor_id = '85d974f0-b319-4ea5-aba2-c2db0b57c35e'
WHERE course_id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35';

-- Step 2: Drop the existing function first (to change return type)
DROP FUNCTION IF EXISTS public.insert_message(UUID, UUID, TEXT);

-- Step 3: Create the SECURITY DEFINER function to insert messages bypassing RLS
CREATE FUNCTION public.insert_message(
  p_course_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS SETOF public.gc_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_instructor_id UUID;
BEGIN
  -- Check if the sender is the instructor of the course
  SELECT instructor_id INTO v_course_instructor_id
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Check if sender is either the instructor or an enrolled student
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE course_id = p_course_id 
    AND student_id = p_sender_id 
    AND status = 'active'
  ) AND p_sender_id != v_course_instructor_id THEN
    RAISE EXCEPTION 'User is not authorized to send messages to this course';
  END IF;
  
  -- Insert the message and return the inserted row
  RETURN QUERY
  INSERT INTO public.gc_messages (course_id, sender_id, content, is_deleted, is_pinned)
  VALUES (p_course_id, p_sender_id, p_content, false, false)
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_message TO authenticated;

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_message';
