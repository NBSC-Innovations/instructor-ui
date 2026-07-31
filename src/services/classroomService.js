import { supabase } from '../utils/supabaseClient';
import { normalizeCode } from '../utils/sectionValidation';

/**
 * Matches the LIVE data shape confirmed from an actual Supabase export:
 * sections.name holds the code itself (e.g. "ICS79"), sections.description
 * holds the human-readable subject title, and course_id is nullable and
 * currently unused by every existing row — there is no courses-table join
 * in this flow. If the courses table gets properly wired in later, this
 * file is the one place that needs to change.
 *
 * There is also no separate "classroom" or "group chat" entity — gc_messages
 * references section_id directly, so creating/claiming the section row is
 * the entire job here.
 */

export async function suggestSections(query) {
  const q = normalizeCode(query);
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from('sections')
    .select('id, name, description, instructor_id')
    .ilike('name', `%${q}%`)
    .limit(5);

  if (error) {
    console.error('suggestSections error:', error);
    return [];
  }
  return data || [];
}

export async function resolveSectionByCode(code) {
  const normalized = normalizeCode(code);

  const { data: section, error } = await supabase
    .from('sections')
    .select('id, name, description, instructor_id')
    .ilike('name', normalized)
    .maybeSingle();

  if (error) throw error;

  if (!section) {
    return { status: 'not_found', code: normalized };
  }
  if (!section.instructor_id) {
    return { status: 'unclaimed', section };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (section.instructor_id === user?.id) {
    return { status: 'already_yours', section };
  }
  return { status: 'taken', section };
}

export async function claimSection(sectionId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('sections')
    .update({ instructor_id: user.id })
    .eq('id', sectionId)
    .is('instructor_id', null) // matches the sections_claim_unassigned RLS policy
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Explicit create — call only after the UI confirms resolveSectionByCode()
 * returned 'not_found' and the instructor supplied a title. course_id is
 * intentionally omitted (left null), matching every existing row.
 */
export async function createSection(code, title) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: section, error } = await supabase
    .from('sections')
    .insert({
      name: normalizeCode(code),
      description: title.trim(),
      instructor_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return section;
}
