import '../styles/Dashboard.css'

// NOTE: this replaces the copied FacebookPages directory from the student UI —
// that was a student-facing "official college pages" list and doesn't fit the
// instructor's dashboard. Delete src/components/FacebookPages.jsx and
// src/data/facebookPages.js from this repo if nothing else here still uses them.
//
// No unread-count widget here yet — deliberately deferred, see GroupChats.jsx note.

function Dashboard({ subjects, onEnterSubject }) {
  const totalSections = subjects.length
  const activeSections = subjects.filter((s) => s.enrolledCount > 0)
  const waitingSections = subjects.filter((s) => s.enrolledCount === 0)

  const recentChats = activeSections
    .map((s) => {
      const messages = s.messages ?? []
      const lastMessage = messages[messages.length - 1] ?? null
      return { ...s, lastMessage }
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 3)

  return (
    <div className="dashboard">
      <div className="dashboard__summary">
        <div className="summary-card">
          <div className="summary-card__value">{activeSections.length}/{totalSections}</div>
          <div className="summary-card__label">sections with an active chat</div>
        </div>
        {waitingSections.length > 0 && (
          <div className="summary-card summary-card--muted">
            <div className="summary-card__value">{waitingSections.length}</div>
            <div className="summary-card__label">still waiting for students</div>
          </div>
        )}
      </div>

      <div className="dashboard__recent">
        <h3 className="dashboard__recent-heading">Recent chats</h3>
        {recentChats.length === 0 && (
          <p className="dashboard__empty">No active chats yet.</p>
        )}
        {recentChats.map((subject) => (
          <button
            key={subject.id}
            type="button"
            className="recent-chat-row"
            onClick={() => onEnterSubject(subject.id)}
          >
            <span className="recent-chat-row__code">{subject.code}</span>
            <span className="recent-chat-row__preview">
              {subject.lastMessage
                ? `${subject.lastMessage.senderName}: ${subject.lastMessage.content}`
                : 'No messages yet'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
