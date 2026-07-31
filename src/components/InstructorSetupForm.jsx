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
    setCreateTitle,
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
        Enter every section you handle by its code. Sections with students already
        matched will connect you to them immediately.
      </p>

      {rows.map((row) => (
        <SectionCodeInput
          key={row.id}
          row={row}
          canRemove={rows.length > 1}
          onChange={(patch) => updateRow(row.id, patch)}
          onQueryCode={(q) => refreshSuggestions(row.id, q)}
          onPickSuggestion={(s) => applySuggestion(row.id, s)}
          onRemove={() => removeRow(row.id)}
        />
      ))}

      <button type="button" className="setup-form__add" onClick={addRow}>
        + Add another section
      </button>

      {pendingCreate && (
        <div className="alert alert--info" style={{ position: 'static', transform: 'none', margin: '14px 0', flexDirection: 'column', alignItems: 'stretch' }}>
          <span className="alert__msg">
            No existing section matches "{pendingCreate.code}". Enter the subject title to create it as a new section.
          </span>
          <input
            className="setup-input"
            style={{ margin: '10px 0' }}
            placeholder="Subject title (e.g. Purposive Communication)"
            value={pendingCreate.title}
            onChange={(e) => setCreateTitle(e.target.value)}
          />
          {pendingCreate.titleError && (
            <span className="setup-row__status setup-row__status--error">{pendingCreate.titleError}</span>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="login__link-btn login__link-btn--sm" onClick={confirmCreate}>
              Create section
            </button>
            <button type="button" className="alert__close" onClick={cancelCreate}>Cancel</button>
          </div>
        </div>
      )}

      <button className="setup-form__submit" type="submit" disabled={submitting}>
        {submitting ? 'Checking...' : 'Continue'}
      </button>
    </form>
  );
}
