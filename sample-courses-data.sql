-- ============================================
-- SAMPLE COURSES, GROUP CHATS, AND MESSAGES DATA
-- Run this in Supabase SQL Editor after sample-profiles-data.sql
-- This creates courses, group chats, enrollments, and sample messages
-- ============================================

-- ============================================
-- STEP 1: CREATE COURSES (assigned to instructor)
-- ============================================

INSERT INTO public.courses (id, code, title, description, instructor_id, department, credits, max_students, current_students, semester, academic_year, schedule, is_active)
VALUES 
  (gen_random_uuid(), 'CS101', 'Introduction to Computer Science', 'Fundamental concepts of programming and computer science', 'd11af2b6-3882-462f-9243-d4286d4115b2', 'Institute for Computer Studies (ICS)', 3, 40, 1, '1st Semester 2024-2025', '2024-2025', '{"days": ["M", "W", "F"], "time": "08:00-09:00", "room": "Room 101"}'::jsonb, true),
  (gen_random_uuid(), 'IT201', 'Web Development', 'Modern web technologies and frameworks', 'd11af2b6-3882-462f-9243-d4286d4115b2', 'Institute for Computer Studies (ICS)', 3, 35, 1, '1st Semester 2024-2025', '2024-2025', '{"days": ["T", "TH"], "time": "10:00-11:30", "room": "Lab 201"}'::jsonb, true),
  (gen_random_uuid(), 'CS301', 'Database Systems', 'Database design and SQL programming', 'd11af2b6-3882-462f-9243-d4286d4115b2', 'Institute for Computer Studies (ICS)', 3, 30, 1, '1st Semester 2024-2025', '2024-2025', '{"days": ["M", "W"], "time": "14:00-15:30", "room": "Lab 202"}'::jsonb, true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructor_id = EXCLUDED.instructor_id,
  department = EXCLUDED.department,
  updated_at = NOW();

-- ============================================
-- STEP 2: CREATE GROUP CHATS FOR EACH COURSE
-- ============================================

INSERT INTO public.group_chats (id, course_id, name, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  c.code || ' - ' || c.title,
  NOW()
FROM public.courses c
WHERE c.code IN ('CS101', 'IT201', 'CS301')
ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name;

-- ============================================
-- STEP 3: ENROLL STUDENT IN COURSES
-- ============================================

INSERT INTO public.enrollments (id, student_id, course_id, status, enrolled_at)
SELECT 
  gen_random_uuid(),
  'b7a67687-941a-4cc6-9a5e-145278124b45',
  c.id,
  'active',
  NOW()
FROM public.courses c
WHERE c.code IN ('CS101', 'IT201', 'CS301')
ON CONFLICT (student_id, course_id) DO UPDATE SET
  status = EXCLUDED.status,
  enrolled_at = EXCLUDED.enrolled_at;

-- Update course student counts
UPDATE public.courses SET current_students = 1 WHERE code IN ('CS101', 'IT201', 'CS301');

-- ============================================
-- STEP 4: ADD MEMBERS TO GROUP CHATS
-- ============================================

INSERT INTO public.group_chat_members (id, group_chat_id, user_id, joined_at)
SELECT 
  gen_random_uuid(),
  gc.id,
  p.id,
  NOW()
FROM public.group_chats gc
CROSS JOIN public.profiles p
WHERE p.id IN ('d11af2b6-3882-462f-9243-d4286d4115b2', 'b7a67687-941a-4cc6-9a5e-145278124b45')
AND EXISTS (
  SELECT 1 FROM public.courses c 
  WHERE c.id = gc.course_id 
  AND c.code IN ('CS101', 'IT201', 'CS301')
)
ON CONFLICT (group_chat_id, user_id) DO NOTHING;

-- ============================================
-- STEP 5: CREATE SAMPLE MESSAGES IN GROUP CHATS
-- ============================================

-- CS101 Messages
INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'Welcome to CS101! Please check the course syllabus in the announcements.',
  NOW() - INTERVAL '2 days'
FROM public.courses c WHERE c.code = 'CS101';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'b7a67687-941a-4cc6-9a5e-145278124b45',
  'Thank you, Instructor! When is the first assignment due?',
  NOW() - INTERVAL '1 day'
FROM public.courses c WHERE c.code = 'CS101';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'The first assignment will be posted this Friday. It covers basic programming concepts.',
  NOW() - INTERVAL '1 day'
FROM public.courses c WHERE c.code = 'CS101';

-- IT201 Messages
INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'Class, please bring your laptops to tomorrow lab session for React setup.',
  NOW() - INTERVAL '3 hours'
FROM public.courses c WHERE c.code = 'IT201';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'b7a67687-941a-4cc6-9a5e-145278124b45',
  'Noted! Will Node.js be pre-installed?',
  NOW() - INTERVAL '2 hours'
FROM public.courses c WHERE c.code = 'IT201';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'Yes, but I recommend installing it beforehand. Check the setup guide in the course materials.',
  NOW() - INTERVAL '2 hours'
FROM public.courses c WHERE c.code = 'IT201';

-- CS301 Messages
INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'Remember: Database project proposal is due next Monday.',
  NOW() - INTERVAL '5 hours'
FROM public.courses c WHERE c.code = 'CS301';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'b7a67687-941a-4cc6-9a5e-145278124b45',
  'Can we work in groups for the project?',
  NOW() - INTERVAL '4 hours'
FROM public.courses c WHERE c.code = 'CS301';

INSERT INTO public.gc_messages (id, course_id, sender_id, content, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'Yes, groups of 2-3 students. Please submit your group members by Friday.',
  NOW() - INTERVAL '4 hours'
FROM public.courses c WHERE c.code = 'CS301';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all courses with instructor
SELECT 'COURSES' as step, c.id, c.code, c.title, p.full_name as instructor, c.current_students
FROM public.courses c
LEFT JOIN public.profiles p ON c.instructor_id = p.id
ORDER BY c.code;

-- View group chats
SELECT 'GROUP CHATS' as step, gc.id, gc.name, c.code as course_code
FROM public.group_chats gc
JOIN public.courses c ON gc.course_id = c.id
ORDER BY c.code;

-- View enrollments
SELECT 'ENROLLMENTS' as step, e.id, p.full_name as student, c.code as course, e.status
FROM public.enrollments e
JOIN public.profiles p ON e.student_id = p.id
JOIN public.courses c ON e.course_id = c.id
ORDER BY c.code;

-- View recent messages
SELECT 'MESSAGES' as step, c.code as course, p.full_name as sender, gm.content, gm.created_at
FROM public.gc_messages gm
JOIN public.courses c ON gm.course_id = c.id
JOIN public.profiles p ON gm.sender_id = p.id
ORDER BY gm.created_at DESC
LIMIT 10;
