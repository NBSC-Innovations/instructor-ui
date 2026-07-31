export default function SectionCodeInput({ row, onChange, onQueryCourseCode, onPickSuggestion, onRemove, onSubmitRow, canRemove }) {
  return (
    <div className="setup-row">
      <div className="setup-row__inputs">
        <div className="setup-row__field">
          <input
            className="setup-input"
            placeholder="Course code (e.g. ICS001)"
            value={row.courseCode}
            onChange={(e) => {
              onChange({ courseCode: e.target.value });
              onQueryCourseCode(e.target.value);
            }}
          />
          {row.suggestions?.length > 0 && (
            <ul className="setup-row__suggestions">
              {row.suggestions.map((s) => (
                <li key={s.id} onClick={() => onPickSuggestion(s)}>
                  {s.courses?.code} — {s.name} {s.instructor_id ? '(assigned)' : '(open)'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          className="setup-input"
          placeholder="Section (e.g. BSIT 3A)"
          value={row.sectionName}
          onChange={(e) => onChange({ sectionName: e.target.value })}
        />

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
