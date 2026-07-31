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

export async function hasAssignedSections(instructorId) {
  const { count, error } = await supabase
    .from('sections')
    .select('id', { count: 'exact', head: true })
    .eq('instructor_id', instructorId);
  if (error) throw error;
  return (count || 0) > 0;
}

/** Read-only list for the Profile page. No courses join — see classroomService.js note. */
export async function fetchAssignedSections(instructorId) {
  const { data, error } = await supabase
    .from('sections')
    .select('id, name, description, section_enrollments ( id )')
    .eq('instructor_id', instructorId);
  if (error) throw error;

  return (data || []).map((s) => ({
    id: s.id,
    code: s.name,
    title: s.description,
    enrolledCount: s.section_enrollments?.length || 0,
  }));
}
