import { supabase } from '../utils/supabaseClient';
import { normalizeCode } from '../utils/sectionValidation';

/**
 * There is no separate "classroom" or "group chat" table to create.
 * A section IS the classroom, and gc_messages references section_id
 * directly — so "the chat" always exists the instant the section row
 * does, with zero messages until someone sends one. Claiming or
 * creating a section is the entire job here; nothing else to spin up.
 */

export async function suggestSections(query) {
  const q = normalizeCode(query);
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from('sections')
    .select('id, name, instructor_id, courses ( code, title )')
    .or(`name.ilike.%${q}%,courses.code.ilike.%${q}%`)
    .limit(5);

  if (error) {
    console.error('suggestSections error:', error);
    return [];
  }
  return data || [];
}

export async function resolveSection(courseCode, sectionName) {
  const code = normalizeCode(courseCode);
  const name = normalizeCode(sectionName);

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('id, code, title')
    .ilike('code', code)
    .maybeSingle();
  if (courseErr) throw courseErr;

  if (!course) {
    return { status: 'not_found', courseCode: code, sectionName: name };
  }

  const { data: section, error: sectionErr } = await supabase
    .from('sections')
    .select('id, name, instructor_id')
    .eq('course_id', course.id)
    .ilike('name', name)
    .maybeSingle();
  if (sectionErr) throw sectionErr;

  if (!section) {
    return { status: 'not_found', courseCode: code, sectionName: name, course };
  }
  if (!section.instructor_id) {
    return { status: 'unclaimed', section, course };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (section.instructor_id === user?.id) {
    return { status: 'already_yours', section, course };
  }
  return { status: 'taken', section, course };
}

export async function claimSection(sectionId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('sections')
    .update({ instructor_id: user.id })
    .eq('id', sectionId)
    .is('instructor_id', null)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Explicit create — call only after the UI has confirmed with the
 * instructor that resolveSection() returned 'not_found' and they
 * still want to proceed. Creates the course row too if it's new.
 */
export async function createSection(courseCode, courseTitle, sectionName) {
  const code = normalizeCode(courseCode);
  const name = normalizeCode(sectionName);

  let { data: course } = await supabase
    .from('courses')
    .select('id')
    .ilike('code', code)
    .maybeSingle();

  if (!course) {
    const { data: newCourse, error: courseErr } = await supabase
      .from('courses')
      .insert({ code, title: courseTitle || code })
      .select()
      .single();
    if (courseErr) throw courseErr;
    course = newCourse;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: section, error: sectionErr } = await supabase
    .from('sections')
    .insert({ course_id: course.id, name, instructor_id: user.id })
    .select()
    .single();
  if (sectionErr) throw sectionErr;
  return section;
}
