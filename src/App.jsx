import { useState } from 'react'
import Sidebar, { navItems } from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MySubjects from './pages/MySubjects.jsx'
import ClassRoom from './pages/ClassRoom.jsx'
import mySubjectsData from './data/mySubjects.js'
import './App.css'

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

  // Subject data lives here for now (mock). Once Supabase is wired up,
  // replace this with a fetch of sections assigned to the logged-in instructor.
  const [subjects, setSubjects] = useState(mySubjectsData)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)

  const handleNavigate = (id) => {
    setActivePage(id)
    setSelectedSubjectId(null) // leaving My Subjects resets any open classroom
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    // TODO: wire up actual logout logic (Supabase Auth signOut)
    console.log('Logout clicked')
  }

  const handleEnterSubject = (subjectId) => {
    setSelectedSubjectId(subjectId)
  }

  const handleBackToSubjects = () => {
    setSelectedSubjectId(null)
  }

  const handleSaveLink = (subjectId, link) => {
    // TODO: replace with Supabase update once the GCPosts table exists
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, gcLink: link } : s))
    )
  }

  const currentLabel = navItems.find((item) => item.id === activePage)?.label ?? ''
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'my-subjects':
        if (selectedSubject) {
          return (
            <ClassRoom
              subject={selectedSubject}
              onBack={handleBackToSubjects}
              onSaveLink={handleSaveLink}
            />
          )
        }
        return <MySubjects subjects={subjects} onEnterSubject={handleEnterSubject} />
      // case 'profile':
      //   return <Profile />
      default:
        return <Dashboard />
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
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
