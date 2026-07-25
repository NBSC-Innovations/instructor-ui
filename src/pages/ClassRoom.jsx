import { useState } from 'react'
import '../styles/ClassRoom.css'

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function LinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ClassRoom({ subject, onBack, onSaveLink }) {
  const [linkInput, setLinkInput] = useState(subject.gcLink || '')
  const [isEditing, setIsEditing] = useState(!subject.gcLink)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    if (!linkInput.trim()) return
    // TODO: replace with actual Supabase update once backend is ready
    onSaveLink(subject.id, linkInput.trim())
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="classroom">
      <button type="button" className="classroom__back" onClick={onBack}>
        <ArrowLeftIcon width={16} height={16} />
        Back to My Subjects
      </button>

      <div className="classroom__header">
        <div className="classroom__code">{subject.code}</div>
        <h2 className="classroom__name">{subject.name}</h2>
        <p className="classroom__meta">
          {subject.section} &middot; {subject.enrolledCount} student{subject.enrolledCount === 1 ? '' : 's'} enrolled
        </p>
      </div>

      <div className="classroom__gc-panel">
        <h3 className="classroom__gc-title">Group Chat Link</h3>

        {!isEditing ? (
          <div className="classroom__gc-current">
            <LinkIcon className="classroom__gc-icon" />
            <a href={subject.gcLink} target="_blank" rel="noopener noreferrer" className="classroom__gc-link">
              {subject.gcLink}
            </a>
            <button type="button" className="classroom__gc-edit" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </div>
        ) : (
          <form className="classroom__gc-form" onSubmit={handleSave}>
            <input
              type="url"
              placeholder="Paste the Facebook Group Chat link (or whatever platform you're using)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              required
            />
            <div className="classroom__gc-form-actions">
              {subject.gcLink && (
                <button
                  type="button"
                  className="classroom__gc-cancel"
                  onClick={() => {
                    setLinkInput(subject.gcLink)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="classroom__gc-save">
                Save Link
              </button>
            </div>
          </form>
        )}

        {saved && <p className="classroom__gc-saved">Saved.</p>}
      </div>
    </section>
  )
}

export default ClassRoom
