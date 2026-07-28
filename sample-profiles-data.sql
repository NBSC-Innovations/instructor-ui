-- ============================================
-- SAMPLE PROFILES DATA
-- Run this in Supabase SQL Editor to insert sample users
-- This creates a student and instructor profile for testing interactions
-- ============================================

-- Insert student profile
INSERT INTO public.profiles (id, email, full_name, role, student_id, department, avatar_url, bio, created_at, updated_at)
VALUES (
  'b7a67687-941a-4cc6-9a5e-145278124b45',
  '20231035@nbsc.edu.ph',
  'Kristine Legaspe Lopez',
  'student',
  '20231025',
  NULL,
  NULL,
  NULL,
  '2026-07-28 09:33:53.441157+00',
  '2026-07-28 09:50:01.799413+00'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  student_id = EXCLUDED.student_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = EXCLUDED.updated_at;

-- Insert instructor profile
INSERT INTO public.profiles (id, email, full_name, role, student_id, department, avatar_url, bio, created_at, updated_at)
VALUES (
  'd11af2b6-3882-462f-9243-d4286d4115b2',
  'nekochii57@gmail.com',
  'Kristine L. Lopez',
  'instructor',
  NULL,
  'Institute for Computer Studies (ICS)',
  NULL,
  NULL,
  '2026-07-28 09:29:58.829724+00',
  '2026-07-28 09:31:01.454037+00'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  student_id = EXCLUDED.student_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = EXCLUDED.updated_at;

-- Verify the profiles were inserted
SELECT 'PROFILES' as step, id, email, full_name, role, student_id, department
FROM public.profiles
WHERE id IN ('b7a67687-941a-4cc6-9a5e-145278124b45', 'd11af2b6-3882-462f-9243-d4286d4115b2')
ORDER BY role;
