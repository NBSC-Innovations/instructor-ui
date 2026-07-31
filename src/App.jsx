
import { useState, useEffect } from 'react'
import Sidebar, { navItems } from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MySubjects from './pages/MySubjects.jsx'
import GroupChats from './pages/GroupChats.jsx'
import ClassRoom from './pages/ClassRoom.jsx'
import Profile from './pages/Profile.jsx'
import { supabase } from './utils/supabaseClient'
import { useToast } from './utils/toast.jsx'
import Login from './pages/Login.jsx'
import NbscLogo from './assets/Nbsc-logo.png'
import { 
  fetchInstructorProfile, 
  fetchCoursesWithMessages,
  fetchSectionsWithMessages,
  fetchInstructorCourses,
  updateInstructorProfile,
  sendMessage,
  toggleMessagePin
} from './services/database'
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
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [activePage, setActivePage] = useState('group-chats')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toast = useToast()

  const [subjects, setSubjects] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Fetch instructor profile and courses when session is established
  useEffect(() => {
    const loadInstructorData = async () => {
      if (!session?.user?.email) return

      console.log('[App] Loading instructor data for:', session.user.email)
      console.log('[App] Auth user ID:', session.user.id)
      setDataLoading(true)
      try {
        // Fetch instructor profile
        const instructorProfile = await fetchInstructorProfile(session.user.email)
        console.log('[App] Instructor profile fetched:', instructorProfile)
        console.log('[App] Profile ID:', instructorProfile?.id)

        if (instructorProfile) {
          setProfile({
            id: instructorProfile.id,
            fullName: instructorProfile.full_name,
            email: instructorProfile.email,
            rank: instructorProfile.rank,
            department: instructorProfile.department,
            contactNumber: '', // profiles table doesn't have contact_number
            avatarUrl: instructorProfile.avatar_url,
            bio: instructorProfile.bio,
          })

          // Fetch section-based subjects with messages
          const sectionsData = await fetchSectionsWithMessages(instructorProfile.id)
          console.log('[App] Sections data fetched:', sectionsData)
          setSubjects(sectionsData)

          // Fetch courses for section management
          const instructorCourses = await fetchInstructorCourses(instructorProfile.id)
          console.log('[App] Instructor courses fetched:', instructorCourses)
          setCourses(instructorCourses)
        } else {
          console.log('[App] No instructor profile found for:', session.user.email)
          toast.error('No instructor profile found. Please ensure your profile has role=instructor in the database.')
        }
      } catch (error) {
        console.error('[App] Error loading instructor data:', error)
        toast.error('Failed to load data. Please try again.')
      } finally {
        setDataLoading(false)
      }
    }

    loadInstructorData()
  }, [session]) // eslint-disable-line

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setSession(session)
      } else if (session) {
        supabase.auth.signOut()
        setAuthError('Invalid session.')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth]', _event, session?.user?.email ?? 'no session')

      if (_event === 'SIGNED_OUT') {
        setSession(null)
        setAuthError('')
        setLoading(false)
        setProfile(null)
        setSubjects([])
        return
      }

      if (_event === 'SIGNED_IN' && session?.user?.email) {
        setSession(session)
        setAuthError('')
        setLoading(false)
        return
      }

      if (session?.user?.email) {
        setSession(session)
        setAuthError('')
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  const handleNavigate = (id) => {
    setActivePage(id)
    setSelectedSubjectId(null) // leaving a list page closes any open chat
    setSidebarOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.info('You have been signed out.')
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

  const handleSendMessage = async (subjectId, content) => {
    console.log('[handleSendMessage] Session:', session)
    console.log('[handleSendMessage] Session user:', session?.user)
    console.log('[handleSendMessage] Session user ID:', session?.user?.id)
    console.log('[handleSendMessage] Profile ID:', profile?.id)
    
    if (!session?.user?.id) {
      console.error('[handleSendMessage] No session user ID available')
      return
    }
    
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject?.id) {
      console.error('[handleSendMessage] No section ID found for subject:', subjectId)
      return
    }
    
    console.log('[handleSendMessage] Sending message with:', {
      sectionId: subject.id,
      senderId: session.user.id,
      profileId: profile?.id,
      content: content
    })
    
    const newMessage = await sendMessage(subject.id, session.user.id, content)
    
    if (newMessage) {
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== subjectId) return s
          return { 
            ...s, 
            messages: [...(s.messages ?? []), {
              id: newMessage.id,
              senderName: newMessage.profiles?.full_name || 'You',
              senderRole: newMessage.profiles?.role || 'instructor',
              content: newMessage.content,
              createdAt: newMessage.created_at,
              pinned: false
            }]
          }
        })
      )
    } else {
      toast.error('Failed to send message. Please try again.')
    }
  }

  const handleTogglePin = async (subjectId, messageId) => {
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject) return

    const message = subject.messages.find((m) => m.id === messageId)
    if (!message) return

    const newPinnedState = !message.pinned
    const result = await toggleMessagePin(messageId, newPinnedState)

    if (result) {
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== subjectId) return s
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, pinned: newPinnedState } : m
            )
          }
        })
      )
    } else {
      toast.error('Failed to pin message. Please try again.')
    }
  }

  const handleSaveProfile = async (updated) => {
    if (!profile?.id) return
    
    const result = await updateInstructorProfile(profile.id, {
      full_name: updated.fullName,
      rank: updated.rank,
      department: updated.department,
      avatar_url: updated.avatarUrl,
      bio: updated.bio,
    })
    
    if (result) {
      setProfile(updated)
      toast.success('Profile updated successfully!')
    } else {
      toast.error('Failed to update profile. Please try again.')
    }
  }

  const handleSectionChange = async (options = {}) => {
    if (!profile?.id) return
    
    // Refresh section-based subjects and courses data
    const sectionsData = await fetchSectionsWithMessages(profile.id)
    const instructorCourses = await fetchInstructorCourses(profile.id)
    
    setSubjects(sectionsData)
    setCourses(instructorCourses)
  }

  const currentLabel = navItems.find((item) => item.id === activePage)?.label ?? ''
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  if (loading) {
    return (
      <div className="home">
        <div className="home__card home__card--center">
          <p>Loading...</p>
          {authError && <p style={{color: 'red', marginTop: '10px'}}>{authError}</p>}
        </div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="home">
        <div className="home__card home__card--center">
          <p>Loading instructor data...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

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
        return (
          <MySubjects 
            subjects={subjects} 
            onEnterSubject={handleEnterSubject}
            instructorId={profile?.id}
            courses={courses}
            onSectionChange={handleSectionChange}
          />
        )
      case 'group-chats':
        return <GroupChats subjects={subjects} onEnterSubject={handleEnterSubject} />
      case 'profile':
        return (
          <Profile
            profile={profile}
            onSave={handleSaveProfile}
            onAssigned={handleSectionChange}
          />
        )
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
            <img src={NbscLogo} alt="NBSC" className="topbar__logo-img" />
            <span className="topbar__brand-text">NBSC Instructor Portal</span>
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
