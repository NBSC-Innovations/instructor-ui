import { useInstructorSetup } from '../hooks/useInstructorSetup';
import SectionCodeInput from './SectionCodeInput';

export default function InstructorSetupForm({ onComplete }) {
  const {
    rows,
    submitting,
    pendingCreate,
    addRow,
    removeRow,
    updateRow,
    refreshSuggestions,
    applySuggestion,
    submitAll,
    confirmCreate,
    cancelCreate,
  } = useInstructorSetup();

  async function handleSubmit(e) {
    e.preventDefault();
    const anyJoined = await submitAll();
    if (anyJoined) onComplete();
  }

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <p className="setup-form__hint">
        Enter every subject and section you handle. Sections with students already
        matched will connect you to them immediately.
      </p>

      {rows.map((row) => (
        <SectionCodeInput
          key={row.id}
          row={row}
          canRemove={rows.length > 1}
          onChange={(patch) => updateRow(row.id, patch)}
          onQueryCourseCode={(q) => refreshSuggestions(row.id, q)}
          onPickSuggestion={(s) => applySuggestion(row.id, s)}
          onRemove={() => removeRow(row.id)}
        />
      ))}

      <button type="button" className="setup-form__add" onClick={addRow}>
        + Add another section
      </button>

      {pendingCreate && (
        <div className="alert alert--info" style={{ position: 'static', transform: 'none', margin: '14px 0' }}>
          <span className="alert__msg">
            No existing section matches "{pendingCreate.courseCode} {pendingCreate.sectionName}".
            Create it as a new section under your name?
          </span>
          <button type="button" className="login__link-btn login__link-btn--sm" onClick={confirmCreate}>
            Yes, create it
          </button>
          <button type="button" className="alert__close" onClick={cancelCreate}>Cancel</button>
        </div>
      )}

      <button className="setup-form__submit" type="submit" disabled={submitting}>
        {submitting ? 'Checking...' : 'Continue'}
      </button>
    </form>
  );
}
