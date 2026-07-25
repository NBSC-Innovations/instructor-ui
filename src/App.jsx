import { useState } from 'react'
import Sidebar, { navItems } from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MySubjects from './pages/MySubjects.jsx'
import GroupChats from './pages/GroupChats.jsx'
import ClassRoom from './pages/ClassRoom.jsx'
import Profile from './pages/Profile.jsx'
import mySubjectsData from './data/mySubjects.js'
import './App.css'

// TEMP MOCK — replace with the logged-in instructor's row from Supabase Auth /
// InstructorProfiles once that's wired up. Email stays read-only in the UI since
// it's the verified institutional identity, not a self-editable field.
const mockProfile = {
  fullName: 'Juan Dela Cruz',
  email: 'juan.delacruz@nbsc.edu.ph',
  department: 'Institute for Computer Studies (ICS)',
  contactNumber: '',
}

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Subject + chat data lives here for now (mock). Once Supabase is wired up,
  // replace this with: a fetch of sections assigned to the logged-in instructor,
  // and per-section paginated message fetches (see notes in mySubjects.js and
  // ClassRoom.jsx) rather than loading every message up front like this mock does.
  const [subjects, setSubjects] = useState(mySubjectsData)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [profile, setProfile] = useState(mockProfile)

  const handleNavigate = (id) => {
    setActivePage(id)
    setSelectedSubjectId(null) // leaving a list page closes any open chat
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    // TODO: wire up actual logout logic (Supabase Auth signOut)
    console.log('Logout clicked')
  }

  // Entering a chat doesn't have to come from My Subjects specifically — Dashboard
  // and Group Chats both link into the same chat screen, so this just needs to set
  // the selected id; renderPage() below decides what's shown based on activePage
  // + selectedSubjectId together.
  const handleEnterSubject = (subjectId) => {
    setSelectedSubjectId(subjectId)
  }

  const handleBackFromChat = () => {
    setSelectedSubjectId(null)
  }

  const handleSendMessage = (subjectId, content) => {
    // TODO: replace with a Supabase insert into `messages`, then eventually a
    // Realtime subscription instead of local state once that's wired up.
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s
        const newMessage = {
          id: `m-${Date.now()}`,
          senderName: 'You',
          senderRole: 'instructor',
          content,
          createdAt: new Date().toISOString(),
          pinned: false,
        }
        return { ...s, messages: [...(s.messages ?? []), newMessage] }
      })
    )
  }

  const handleTogglePin = (subjectId, messageId) => {
    // TODO: replace with a Supabase update on the message's `pinned` column.
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, pinned: !m.pinned } : m
          ),
        }
      })
    )
  }

  const handleSaveProfile = (updated) => {
    // TODO: replace with a Supabase update on InstructorProfiles.
    setProfile(updated)
  }

  const currentLabel = navItems.find((item) => item.id === activePage)?.label ?? ''
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  const renderPage = () => {
    if (selectedSubject) {
      return (
        <ClassRoom
          subject={selectedSubject}
          onBack={handleBackFromChat}
          onSendMessage={handleSendMessage}
          onTogglePin={handleTogglePin}
        />
      )
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard subjects={subjects} onEnterSubject={handleEnterSubject} />
      case 'my-subjects':
        return <MySubjects subjects={subjects} onEnterSubject={handleEnterSubject} />
      case 'group-chats':
        return <GroupChats subjects={subjects} onEnterSubject={handleEnterSubject} />
      case 'profile':
        return <Profile profile={profile} onSave={handleSaveProfile} />
      default:
        return <Dashboard subjects={subjects} onEnterSubject={handleEnterSubject} />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar__brand">
            <div className="topbar__logo">NBSC</div>
            <span className="topbar__brand-text">NBSC Instructor</span>
          </div>

          <h1 className="topbar__title">
            {selectedSubject ? selectedSubject.code : currentLabel}
          </h1>

          <button
            type="button"
            className="topbar__burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon width={20} height={20} />
          </button>
        </header>

        <main className="content-area">
          <div className="page-container">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
