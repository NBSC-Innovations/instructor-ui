import '../styles/GroupChats.css'

function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// Same underlying section data as My Subjects, but this view only shows sections
// that already have an active chat, sorted by most-recent message — a faster path
// back into an ongoing conversation than searching for it every time.
//
// NOTE: no unread badges yet — that needs real read-state tracking (per-user
// "last read" timestamp), which we're deliberately deferring. Don't fake an unread
// count here; an inaccurate badge is worse than no badge.

function GroupChats({ subjects, onEnterSubject }) {
  const activeChats = subjects
    .filter((s) => s.enrolledCount > 0)
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

  return (
    <section className="group-chats">
      <h2 className="group-chats__heading">Group Chats</h2>
      <p className="group-chats__subtext">
        Your active class conversations, most recent first.
      </p>

      <div className="group-chats__list">
        {activeChats.length === 0 && (
          <p className="group-chats__empty">
            No active group chats yet — they appear here once students are matched to your sections.
          </p>
        )}

        {activeChats.map((subject) => (
          <button
            key={subject.id}
            type="button"
            className="chat-row"
            onClick={() => onEnterSubject(subject.id)}
          >
            <div className="chat-row__main">
              <div className="chat-row__top">
                <span className="chat-row__code">{subject.code}</span>
                <span className="chat-row__section">{subject.section}</span>
              </div>
              <div className="chat-row__preview">
                {subject.lastMessage
                  ? `${subject.lastMessage.senderName}: ${subject.lastMessage.content}`
                  : 'No messages yet'}
              </div>
            </div>
            <div className="chat-row__right">
              {subject.lastMessage && (
                <span className="chat-row__time">{timeAgo(subject.lastMessage.createdAt)}</span>
              )}
              <ArrowRightIcon width={16} height={16} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default GroupChats
