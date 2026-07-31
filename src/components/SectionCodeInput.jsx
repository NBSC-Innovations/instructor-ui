export default function SectionCodeInput({ row, onChange, onQueryCode, onPickSuggestion, onRemove, canRemove }) {
  return (
    <div className="setup-row">
      <div className="setup-row__inputs">
        <div className="setup-row__field">
          <input
            className="setup-input"
            placeholder="Section code (e.g. ICS79)"
            value={row.code}
            onChange={(e) => {
              onChange({ code: e.target.value });
              onQueryCode(e.target.value);
            }}
          />
          {row.suggestions?.length > 0 && (
            <ul className="setup-row__suggestions">
              {row.suggestions.map((s) => (
                <li key={s.id} onClick={() => onPickSuggestion(s)}>
                  {s.name} — {s.description || 'Untitled'} {s.instructor_id ? '(assigned)' : '(open)'}
                </li>
              ))}
            </ul>
          )}
        </div>

        {canRemove && (
          <button type="button" className="setup-row__remove" onClick={onRemove} aria-label="Remove row">
            ✕
          </button>
        )}
      </div>

      {row.status && row.status !== 'confirming' && (
        <p className={`setup-row__status setup-row__status--${row.status}`}>{row.message}</p>
      )}
    </div>
  );
}
