import { useState } from 'react'
import '../styles/Profile.css'

// Department is descriptive metadata only — per the earlier discussion, it should
// never be used to compute which sections an instructor can access (that's an
// explicit per-section assignment, not something derivable from department). This
// field is just for directory/display purposes.
const DEPARTMENTS = [
  'Institute for Teacher Education (ITE)',
  'Institute for Business Management (IBM)',
  'Institute for Computer Studies (ICS)',
  'Department of General Education Curriculum (DGEC)',
  'CSS',
  'RSS',
  'NSTP',
  'PATHFIT',
  'MATH',
]

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// NOTE: profile is local state for now (mock). Real implementation: fetch from the
// instructor's row in Supabase Auth / InstructorProfiles, and PATCH on save. Email
// stays read-only in the UI regardless — it's the institutional-email identity used
// to verify the account, not something an instructor should be able to self-edit.

function Profile({ profile, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(profile)

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    onSave(form)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setForm(profile)
    setIsEditing(false)
  }

  return (
    <section className="profile">
      <div className="profile__card">
        <div className="profile__header">
          <div className="profile__avatar">{getInitials(profile.fullName)}</div>
          <div className="profile__header-text">
            <h2 className="profile__name">{profile.fullName}</h2>
            <span className="profile__role-badge">Instructor</span>
          </div>
          {!isEditing && (
            <button type="button" className="profile__edit-btn" onClick={() => setIsEditing(true)}>
              <EditIcon width={15} height={15} />
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="profile__details">
            <div className="profile__field">
              <span className="profile__field-label">Institutional Email</span>
              <span className="profile__field-value">{profile.email}</span>
            </div>
            <div className="profile__field">
              <span className="profile__field-label">Department</span>
              <span className="profile__field-value">{profile.department}</span>
            </div>
            <div className="profile__field">
              <span className="profile__field-label">Contact Number</span>
              <span className="profile__field-value">{profile.contactNumber || '—'}</span>
            </div>
          </div>
        ) : (
          <form className="profile__form" onSubmit={handleSave}>
            <label className="profile__label">
              Full Name
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                required
              />
            </label>

            <label className="profile__label">
              Institutional Email
              <input type="email" value={form.email} disabled />
            </label>

            <label className="profile__label">
              Department
              <select value={form.department} onChange={handleChange('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className="profile__label">
              Contact Number
              <input
                type="tel"
                placeholder="e.g. 0917 000 0000"
                value={form.contactNumber}
                onChange={handleChange('contactNumber')}
              />
            </label>

            <div className="profile__form-actions">
              <button type="button" className="profile__cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="profile__save">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default Profile
