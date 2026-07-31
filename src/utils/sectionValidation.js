/**
 * Normalizes hand-typed course codes / section names so
 * "ics001" / "ICS001 " / " ICS001" all match the same catalog row,
 * and so we're not creating near-duplicate rows from formatting noise.
 */
export function normalizeCode(value) {
  return (value || '').trim().replace(/\s+/g, ' ');
}

export function isValidSectionRow({ courseCode, sectionName }) {
  const code = normalizeCode(courseCode);
  const name = normalizeCode(sectionName);
  const errors = {};

  if (!code) errors.courseCode = 'Course code is required.';
  if (!name) errors.sectionName = 'Section is required.';
  if (code && code.length > 20) errors.courseCode = 'Course code looks too long — check for a typo.';
  if (name && name.length > 30) errors.sectionName = 'Section looks too long — check for a typo.';

  return { valid: Object.keys(errors).length === 0, errors };
}
