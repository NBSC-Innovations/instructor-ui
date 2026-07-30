import GroupChats from './GroupChats.jsx'

// Dashboard now redirects to GroupChats page
function Dashboard({ subjects, onEnterSubject }) {
  return <GroupChats subjects={subjects} onEnterSubject={onEnterSubject} />
}

export default Dashboard
