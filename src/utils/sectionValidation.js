export function normalizeCode(value) {
  return (value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isValidCode(code) {
  const c = normalizeCode(code);
  if (!c) return { valid: false, error: 'Section code is required.' };
  if (c.length > 20) return { valid: false, error: 'That looks too long for a section code — check for a typo.' };
  return { valid: true, error: null };
}

export function isValidTitle(title) {
  const t = (title || '').trim();
  if (!t) return { valid: false, error: 'Subject title is required for a new section.' };
  if (t.length > 120) return { valid: false, error: 'Title looks too long — check for a typo.' };
  return { valid: true, error: null };
}
