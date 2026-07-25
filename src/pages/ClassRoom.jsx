import { useState, useRef, useEffect } from 'react'
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

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// Text-only chat, per the confirmed scope (no images/video — keeps the DB light).
// Pinning is instructor-only for now; that's a reasonable default since the
// instructor is the one moderating the class thread, but flag it to the team if
// students should ever be able to pin their own messages too.
//
// NOTE: messages here are held in local state (lifted up to App.jsx) purely for
// this mock. Real implementation: fetch most-recent-N messages on open, paginate
// older ones on scroll-up, then layer in a Supabase Realtime subscription for new
// messages — don't try to build both at once, see earlier discussion on phasing.

function ClassRoom({ subject, onBack, onSendMessage, onTogglePin }) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  const messages = subject.messages ?? []
  const pinnedMessages = messages.filter((m) => m.pinned)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSendMessage(subject.id, text)
    setDraft('')
  }

  return (
    <section className="classroom">
      <button type="button" className="classroom__back" onClick={onBack}>
        <ArrowLeftIcon width={16} height={16} />
        Back
      </button>

      <div className="classroom__header">
        <div className="classroom__code">{subject.code}</div>
        <h2 className="classroom__name">{subject.name}</h2>
        <p className="classroom__meta">
          {subject.section} &middot; {subject.enrolledCount} student{subject.enrolledCount === 1 ? '' : 's'}
        </p>
      </div>

      {pinnedMessages.length > 0 && (
        <div className="classroom__pinned">
          <div className="classroom__pinned-label">
            <PinIcon width={14} height={14} />
            Pinned
          </div>
          {pinnedMessages.map((m) => (
            <div key={m.id} className="classroom__pinned-item">
              <span className="classroom__pinned-sender">{m.senderName}:</span> {m.content}
            </div>
          ))}
        </div>
      )}

      <div className="classroom__chat">
        <div className="classroom__messages" ref={scrollRef}>
          {messages.length === 0 && (
            <p className="classroom__empty">No messages yet. Say hello to the class.</p>
          )}

          {messages.map((m) => {
            const isInstructor = m.senderRole === 'instructor'
            return (
              <div
                key={m.id}
                className={`chat-message ${isInstructor ? 'chat-message--instructor' : 'chat-message--student'}`}
              >
                <div className="chat-message__bubble">
                  {!isInstructor && <div className="chat-message__sender">{m.senderName}</div>}
                  <div className="chat-message__content">{m.content}</div>
                  <div className="chat-message__footer">
                    <span className="chat-message__time">{formatTime(m.createdAt)}</span>
                    <button
                      type="button"
                      className={`chat-message__pin ${m.pinned ? 'chat-message__pin--active' : ''}`}
                      onClick={() => onTogglePin(subject.id, m.id)}
                      aria-label={m.pinned ? 'Unpin message' : 'Pin message'}
                      title={m.pinned ? 'Unpin message' : 'Pin message'}
                    >
                      <PinIcon width={13} height={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <form className="classroom__composer" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message or paste a link..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="classroom__send" aria-label="Send message">
            <SendIcon width={18} height={18} />
          </button>
        </form>
      </div>
    </section>
  )
}

export default ClassRoom
