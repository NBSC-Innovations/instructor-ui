import { useState, useMemo } from 'react'
import '../styles/MySubjects.css'

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function MySubjects({ subjects, onEnterSubject }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    )
  }, [subjects, query])

  return (
    <section className="my-subjects">
      <h2 className="my-subjects__heading">My Subjects</h2>
      <p className="my-subjects__subtext">
        Subjects currently assigned to you. Once students are matched to a section, you can enter it to manage the class group chat.
      </p>

      <div className="my-subjects__search">
        <SearchIcon className="my-subjects__search-icon" />
        <input
          type="text"
          placeholder="Search by subject code, name, or section..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="my-subjects__list">
        {filtered.length === 0 && (
          <p className="my-subjects__empty">No subjects match your search.</p>
        )}

        {filtered.map((subject) => {
          const hasStudents = subject.enrolledCount > 0
          const hasGc = Boolean(subject.gcLink)

          return (
            <div key={subject.id} className="subject-card">
              <div className="subject-card__main">
                <div className="subject-card__code">{subject.code}</div>
                <div className="subject-card__name">{subject.name}</div>
                <div className="subject-card__meta">
                  <span>{subject.section}</span>
                  <span className="subject-card__dot">&middot;</span>
                  <span>{subject.enrolledCount} student{subject.enrolledCount === 1 ? '' : 's'} enrolled</span>
                  {hasGc && (
                    <>
                      <span className="subject-card__dot">&middot;</span>
                      <span className="subject-card__gc-badge">GC set</span>
                    </>
                  )}
                </div>
              </div>

              {hasStudents ? (
                <button
                  type="button"
                  className="subject-card__enter"
                  onClick={() => onEnterSubject(subject.id)}
                >
                  Enter
                  <ArrowRightIcon width={16} height={16} />
                </button>
              ) : (
                <div className="subject-card__waiting">
                  Waiting for students
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MySubjects
