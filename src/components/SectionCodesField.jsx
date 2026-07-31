import { useState, useRef } from 'react';
import {
  suggestSections,
  resolveSection,
  claimSection,
  createSection,
} from '../services/sectionAssignment';

/**
 * Drop this into Profile.jsx wherever the "Section Codes" field of
 * the form should live. It manages its own list of rows/status and
 * doesn't require the parent to track anything beyond an optional
 * onChange callback if the parent wants the current list for saving
 * elsewhere (rank/college are plain profile fields and can stay in
 * Profile.jsx's own form state — this component only owns section
 * matching/claiming, since that part talks to two extra tables).
 */
export default function SectionCodesField({ onAssigned }) {
  const [courseCode, setCourseCode] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [rows, setRows] = useState([]); // { courseCode, sectionName, status, message }
  const [pendingCreate, setPendingCreate] = useState(null); // holds a not_found result awaiting confirm
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef(null);

  function handleCourseCodeChange(value) {
    setCourseCode(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await suggestSections(value);
      setSuggestions(results);
    }, 250);
  }

  function pickSuggestion(s) {
    setCourseCode(s.courses?.code || '');
    setSectionName(s.name);
    setSuggestions([]);
  }

  async function handleSubmitRow(e) {
    e.preventDefault();
    if (!courseCode.trim() || !sectionName.trim()) return;

    setBusy(true);
    try {
      const result = await resolveSection(courseCode, sectionName);

      if (result.status === 'unclaimed') {
        const section = await claimSection(result.section.id);
        addRow(courseCode, sectionName, 'joined', 'Joined — existing section, now assigned to you.');
        onAssigned?.(section);
        resetInputs();
      } else if (result.status === 'already_yours') {
        addRow(courseCode, sectionName, 'joined', 'Already assigned to you.');
        resetInputs();
      } else if (result.status === 'taken') {
        addRow(courseCode, sectionName, 'error', 'This section is already assigned to another instructor. Contact an admin if this is wrong.');
      } else if (result.status === 'not_found') {
        // Don't create silently — ask for confirmation first, since a
        // typo here creates a real duplicate catalog entry.
        setPendingCreate(result);
      }
    } catch (err) {
      addRow(courseCode, sectionName, 'error', err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCreate() {
    if (!pendingCreate) return;
    setBusy(true);
    try {
      const section = await createSection(
        pendingCreate.courseCode,
        pendingCreate.courseCode, // no separate title field in this flow; defaults to code
        pendingCreate.sectionName
      );
      addRow(pendingCreate.courseCode, pendingCreate.sectionName, 'joined', 'Created new section and assigned to you.');
      onAssigned?.(section);
      setPendingCreate(null);
      resetInputs();
    } catch (err) {
      addRow(pendingCreate.courseCode, pendingCreate.sectionName, 'error', err.message || 'Could not create section.');
      setPendingCreate(null);
    } finally {
      setBusy(false);
    }
  }

  function addRow(code, name, status, message) {
    setRows((prev) => [...prev, { courseCode: code, sectionName: name, status, message }]);
  }

  function resetInputs() {
    setCourseCode('');
    setSectionName('');
    setSuggestions([]);
  }

  return (
    <div className="section-codes-field">
      <label className="section-codes-field__label">Section Codes</label>
      <p className="section-codes-field__hint">
        Enter each subject and section you handle. Existing sections with students
        already matched will be joined directly; new ones need confirmation.
      </p>

      <form className="section-codes-field__row" onSubmit={handleSubmitRow}>
        <div className="section-codes-field__input-wrap">
          <input
            className="section-codes-field__input"
            placeholder="Course code (e.g. ICS001)"
            value={courseCode}
            onChange={(e) => handleCourseCodeChange(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="section-codes-field__suggestions">
              {suggestions.map((s) => (
                <li key={s.id} onClick={() => pickSuggestion(s)}>
                  {s.courses?.code} — {s.name}
                  {s.instructor_id ? ' (assigned)' : ' (open)'}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          className="section-codes-field__input"
          placeholder="Section (e.g. BSIT 3A)"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
        />
        <button className="section-codes-field__button" type="submit" disabled={busy}>
          Add
        </button>
      </form>

      {pendingCreate && (
        <div className="section-codes-field__pending">
          <span className="section-codes-field__pending-message">
            No existing section matches "{pendingCreate.courseCode} {pendingCreate.sectionName}".
            Create it as a new section under your name?
          </span>
          <button className="section-codes-field__confirm" onClick={confirmCreate} disabled={busy}>
            Yes, create it
          </button>
          <button className="section-codes-field__cancel" onClick={() => setPendingCreate(null)}>Cancel</button>
        </div>
      )}

      <ul className="section-codes-field__list">
        {rows.map((r, i) => (
          <li key={i} className={`section-codes-field__row-status section-codes-field__row-status--${r.status}`}>
            <strong>{r.courseCode} — {r.sectionName}</strong>
            <span>{r.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
