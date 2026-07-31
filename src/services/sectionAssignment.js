import { supabase } from '../utils/supabaseClient';

/**
 * Section self-assignment logic for the instructor Profile page.
 *
 * Flow per entered (courseCode, sectionName) pair:
 *   1. suggestSections(query)      -> autocomplete while typing, catches typos
 *   2. resolveSection(code, name)  -> look up what exists, don't write anything yet
 *   3a. If status === 'unclaimed'  -> claimSection(sectionId)
 *   3b. If status === 'not_found'  -> createSection(code, title, name)  [explicit confirm]
 *   3c. If status === 'taken'      -> show error, do not attempt a write
 *   3d. If status === 'already_yours' -> nothing to do, already assigned
 */

/**
 * Autocomplete: fuzzy-match against existing course codes and section
 * names so an instructor sees "ICS001 / BSIT 3A" before committing to
 * a typo'd new one. Returns up to 5 matches.
 */
export async function suggestSections(query) {
  if (!query || query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from('sections')
    .select('id, name, instructor_id, courses ( code, title )')
    .or(`name.ilike.%${query}%,courses.code.ilike.%${query}%`)
    .limit(5);

  if (error) {
    console.error('suggestSections error:', error);
    return [];
  }
  return data || [];
}

/**
 * Look up a course+section pair without writing anything. Matching is
 * case-insensitive and trims whitespace, since "ics001" / "ICS001 "
 * typed by hand shouldn't create duplicate catalog entries.
 */
export async function resolveSection(courseCode, sectionName) {
  const code = courseCode.trim();
  const name = sectionName.trim();

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

/** Claim an unassigned section — relies on the sections_claim_unassigned RLS policy. */
export async function claimSection(sectionId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('sections')
    .update({ instructor_id: user.id })
    .eq('id', sectionId)
    .is('instructor_id', null) // belt-and-suspenders alongside the RLS USING clause
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Explicit "create new" action — only call this after the instructor
 * has confirmed via the UI that resolveSection() returned 'not_found'
 * and they still want to proceed (i.e. it wasn't just a typo of an
 * existing code). Creates the course row too if it doesn't exist yet.
 */
export async function createSection(courseCode, courseTitle, sectionName) {
  const code = courseCode.trim();
  const name = sectionName.trim();

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
