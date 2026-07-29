-- Create a SECURITY DEFINER function to fetch messages bypassing RLS
-- This will allow both instructors and enrolled students to fetch messages

DROP FUNCTION IF EXISTS public.fetch_course_messages(UUID);

CREATE FUNCTION public.fetch_course_messages(
  p_course_id UUID
)
RETURNS SETOF public.gc_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_instructor_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if the sender is the instructor of the course
  SELECT instructor_id INTO v_course_instructor_id
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Check if user is either the instructor or an enrolled student
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE course_id = p_course_id 
    AND student_id = v_user_id 
    AND status = 'active'
  ) AND v_user_id != v_course_instructor_id THEN
    RAISE EXCEPTION 'User is not authorized to view messages for this course';
  END IF;
  
  -- Fetch and return all non-deleted messages for the course
  RETURN QUERY
  SELECT * FROM public.gc_messages
  WHERE course_id = p_course_id
  AND is_deleted = false
  ORDER BY created_at ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fetch_course_messages TO authenticated;

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'fetch_course_messages';
