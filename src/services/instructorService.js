import { supabase } from '../utils/supabaseClient';

export async function fetchInstructorProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, rank, department, role, verified')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateInstructorProfile(userId, updates) {
  // Only ever touches plain profile fields — never role/verified/is_admin,
  // and never section assignment (that's classroomService's job).
  const { rank, department, full_name } = updates;
  const { data, error } = await supabase
    .from('profiles')
    .update({ rank, department, full_name })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * The gate App.jsx checks right after login. Uses a count-only head
 * request instead of fetching rows, since this runs on every session
 * load and we only need a boolean.
 */
export async function hasAssignedSections(instructorId) {
  const { count, error } = await supabase
    .from('sections')
    .select('id', { count: 'exact', head: true })
    .eq('instructor_id', instructorId);
  if (error) throw error;
  return (count || 0) > 0;
}

/**
 * Read-only list for the Profile page — sections + enrolled count,
 * fetched AFTER setup is already complete. Profile never writes here.
 */
export async function fetchAssignedSections(instructorId) {
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, courses ( code, title ), section_enrollments ( id )')
    .eq('instructor_id', instructorId);
  if (error) throw error;

  return (data || []).map((s) => ({
    id: s.id,
    sectionName: s.name,
    courseCode: s.courses?.code,
    courseTitle: s.courses?.title,
    enrolledCount: s.section_enrollments?.length || 0,
  }));
}
