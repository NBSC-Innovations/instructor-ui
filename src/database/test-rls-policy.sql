-- Test RLS policy by checking what auth.uid() returns in the current context
-- Note: auth.uid() returns NULL in SQL Editor since there's no authenticated session

-- Check current auth user ID (will be NULL in SQL Editor)
SELECT auth.uid() as current_auth_uid;

-- Test if the RLS policy would allow the insert using the actual UUID
-- This simulates what the policy checks when auth.uid() returns the correct value
SELECT 
  '85d974f0-b319-4ea5-aba2-c2db0b57c35e' as sender_id,
  auth.uid() as current_user,
  (SELECT instructor_id FROM public.courses WHERE id = 'd0079571-c937-4b57-9ca3-44c3f38c9e35') as course_instructor;

-- Try a direct insert using the actual UUID (bypassing auth.uid() for testing)
INSERT INTO public.gc_messages (course_id, sender_id, content, is_deleted)
VALUES ('d0079571-c937-4b57-9ca3-44c3f38c9e35', '85d974f0-b319-4ea5-aba2-c2db0b57c35e', 'Test message from SQL Editor', false);

-- If this succeeds, the table structure is fine and the issue is with frontend auth
-- If this fails, there's a table constraint issue
