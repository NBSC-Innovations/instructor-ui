-- Create a SECURITY DEFINER function to insert messages bypassing RLS
-- This function will handle the permission checks manually

CREATE OR REPLACE FUNCTION public.insert_message(
  p_course_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS TABLE (
  id UUID,
  course_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_deleted BOOLEAN,
  is_pinned BOOLEAN
)
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
  
  -- Insert the message
  RETURN QUERY
  INSERT INTO public.gc_messages (course_id, sender_id, content, is_deleted, is_pinned)
  VALUES (p_course_id, p_sender_id, p_content, false, false)
  RETURNING id, course_id, sender_id, content, created_at, is_deleted, is_pinned;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_message TO authenticated;
