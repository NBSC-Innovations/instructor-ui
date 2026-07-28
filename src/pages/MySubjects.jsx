import { useState, useMemo, useEffect } from 'react'
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

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// NOTE on state: a section's chat auto-generates the moment the first student is
// matched into it (confirmed logic) — there is no manual "create chat" step for the
// instructor. So there are only two real states here:
//   - enrolledCount === 0  -> "Waiting for students" (chat doesn't exist yet)
//   - enrolledCount > 0    -> chat exists -> "Enter"

function MySubjects({ subjects, onEnterSubject, instructorId, courses, onSectionChange }) {
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [formData, setFormData] = useState({
    sectionCode: '',
    subjectDescription: '',
    schedule: '',
    room: '',
    maxCapacity: 40
  })

  // Load sections when component mounts or instructor changes
  useEffect(() => {
    const loadSections = async () => {
      if (!instructorId) return
      
      setLoadingSections(true)
      try {
        const { fetchInstructorSections } = await import('../services/database')
        const sectionsData = await fetchInstructorSections(instructorId)
        setSections(sectionsData)
      } catch (error) {
        console.error('Error loading sections:', error)
      } finally {
        setLoadingSections(false)
      }
    }

    loadSections()
  }, [instructorId])

  // Load section-based subjects for display
  useEffect(() => {
    const loadSectionSubjects = async () => {
      if (!instructorId) return
      
      try {
        const { fetchSectionsWithMessages } = await import('../services/database')
        const sectionsData = await fetchSectionsWithMessages(instructorId)
        // Update the subjects prop with section-based data
        if (onSectionChange) {
          // This will trigger a refresh in App.jsx
          onSectionChange()
        }
      } catch (error) {
        console.error('Error loading section subjects:', error)
      }
    }

    loadSectionSubjects()
  }, [instructorId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    )
  }, [subjects, query])

  const handleAddSection = () => {
    setEditingSection(null)
    setFormData({
      sectionCode: '',
      subjectDescription: '',
      schedule: '',
      room: '',
      maxCapacity: 40
    })
    setShowForm(true)
  }

  const handleEditSection = (section) => {
    setEditingSection(section)
    setFormData({
      sectionCode: section.name,
      subjectDescription: section.description || '',
      schedule: section.schedule || '',
      room: section.room || '',
      maxCapacity: section.max_capacity || 40
    })
    setShowForm(true)
  }

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) return
    
    try {
      const { deleteSection } = await import('../services/database')
      const success = await deleteSection(sectionId)
      if (success) {
        // Reload sections
        const { fetchInstructorSections } = await import('../services/database')
        const sectionsData = await fetchInstructorSections(instructorId)
        setSections(sectionsData)
        
        onSectionChange && onSectionChange()
      } else {
        alert('Failed to delete section. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting section:', error.message || error)
      alert(`Error: ${error.message || 'Failed to delete section'}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { createSection, updateSection } = await import('../services/database')
      
      let result
      if (editingSection) {
        result = await updateSection(editingSection.id, {
          name: formData.sectionCode,
          description: formData.subjectDescription,
          schedule: formData.schedule,
          room: formData.room,
          max_capacity: formData.maxCapacity
        })
        if (!result) {
          alert('Failed to update section. Please try again.')
          return
        }
      } else {
        result = await createSection({
          sectionCode: formData.sectionCode,
          description: formData.subjectDescription,
          instructorId: instructorId,
          schedule: formData.schedule,
          room: formData.room,
          maxCapacity: formData.maxCapacity
        })
        if (!result) {
          alert('Failed to create section. Please try again.')
          return
        }
      }
      
      setShowForm(false)
      
      // Reload sections
      const { fetchInstructorSections } = await import('../services/database')
      const sectionsData = await fetchInstructorSections(instructorId)
      setSections(sectionsData)
      
      // Call onSectionChange to refresh data
      if (onSectionChange) {
        onSectionChange()
      }
    } catch (error) {
      console.error('Error saving section:', error.message || error)
      alert(`Error: ${error.message || 'Failed to save section'}`)
    }
  }

  return (
    <section className="my-subjects">
      <div className="my-subjects__header">
        <div>
          <h2 className="my-subjects__heading">My Subjects</h2>
          <p className="my-subjects__subtext">
            Subjects currently assigned to you. A group chat is created automatically once students are matched to a section.
          </p>
        </div>
      </div>

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
          const hasChat = subject.enrolledCount > 0
          const messageCount = subject.messages?.length ?? 0

          return (
            <div key={subject.id} className="subject-card">
              <div className="subject-card__main">
                <div className="subject-card__code">{subject.code}</div>
                <div className="subject-card__name">{subject.name}</div>
                <div className="subject-card__meta">
                  <span>{subject.enrolledCount} student{subject.enrolledCount === 1 ? '' : 's'} enrolled</span>
                  {hasChat && (
                    <>
                      <span className="subject-card__dot">&middot;</span>
                      <span className="subject-card__msg-count">
                        {messageCount} message{messageCount === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {hasChat ? (
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

      {/* Sections Management Section */}
      <div className="my-subjects__sections-section">
        <div className="my-subjects__sections-header">
          <h3>Section Management</h3>
          <button
            type="button"
            className="my-subjects__add-section-btn"
            onClick={handleAddSection}
          >
            <PlusIcon width={16} height={16} />
            Add Section
          </button>
        </div>

        {loadingSections ? (
          <p className="my-subjects__loading">Loading sections...</p>
        ) : sections.length === 0 ? (
          <p className="my-subjects__empty-sections">No sections created yet.</p>
        ) : (
          <div className="my-subjects__section-items">
            {sections.map((section) => (
              <div key={section.id} className="my-subjects__section-item">
                <div className="my-subjects__section-info">
                  <div className="my-subjects__section-name">{section.name}</div>
                  {section.description && (
                    <div className="my-subjects__section-course">{section.description}</div>
                  )}
                  {section.schedule && (
                    <div className="my-subjects__section-meta">{section.schedule}</div>
                  )}
                  {section.room && (
                    <div className="my-subjects__section-meta">Room: {section.room}</div>
                  )}
                </div>
                <div className="my-subjects__section-actions">
                  <button
                    type="button"
                    className="my-subjects__section-edit"
                    onClick={() => handleEditSection(section)}
                    title="Edit section"
                  >
                    <EditIcon width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="my-subjects__section-delete"
                    onClick={() => handleDeleteSection(section.id)}
                    title="Delete section"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="my-subjects__modal-overlay" onClick={() => setShowForm(false)}>
          <div className="my-subjects__modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-subjects__modal-header">
              <h3>{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
              <button
                type="button"
                className="my-subjects__modal-close"
                onClick={() => setShowForm(false)}
              >
                <XIcon width={20} height={20} />
              </button>
            </div>

            <form className="my-subjects__modal-form" onSubmit={handleSubmit}>
              <div className="my-subjects__form-group">
                <label htmlFor="sectionCode">Section Code</label>
                <input
                  id="sectionCode"
                  type="text"
                  placeholder="e.g., BSIT 3A"
                  value={formData.sectionCode}
                  onChange={(e) => setFormData({ ...formData, sectionCode: e.target.value })}
                  required
                />
              </div>

              <div className="my-subjects__form-group">
                <label htmlFor="subjectDescription">Subject Description</label>
                <input
                  id="subjectDescription"
                  type="text"
                  placeholder="e.g., System Integration and Architecture"
                  value={formData.subjectDescription}
                  onChange={(e) => setFormData({ ...formData, subjectDescription: e.target.value })}
                  required
                />
              </div>

              <div className="my-subjects__form-group">
                <label htmlFor="schedule">Schedule</label>
                <input
                  id="schedule"
                  type="text"
                  placeholder="e.g., MWF 9:00-10:00"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                />
              </div>

              <div className="my-subjects__form-group">
                <label htmlFor="room">Room</label>
                <input
                  id="room"
                  type="text"
                  placeholder="e.g., ICT-2"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>

              <div className="my-subjects__form-group">
                <label htmlFor="maxCapacity">Max Capacity</label>
                <input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="my-subjects__form-actions">
                <button
                  type="button"
                  className="my-subjects__form-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="my-subjects__form-submit"
                >
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default MySubjects
