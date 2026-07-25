// src/data/mySubjects.js
//
// TEMP MOCK DATA — replace with real Supabase queries once backend is ready.
//
// Real-world equivalent of this file:
//   1. `sections` query: sections where instructor_id (or a SectionInstructors join
//      row) = current instructor, for the active term.
//   2. enrolledCount: count of StudentEnrollments for that section.
//   3. messages: NOT meant to be fetched all at once in production — this is only
//      inlined here because it's mock data. Real chat messages should be fetched
//      per-section, paginated (most recent N, load older on scroll), and eventually
//      subscribed to via Supabase Realtime. Do not port this "load everything up
//      front" pattern into the real implementation.
//
// GC / chat existence logic (confirmed): a chat auto-generates the moment the first
// student is matched into a section — there is no manual "create" step. So in this
// mock data, enrolledCount > 0 implies the chat already exists.

const now = Date.now()
const minutesAgo = (m) => new Date(now - m * 60 * 1000).toISOString()

const mySubjects = [
  {
    id: 'sec-1',
    code: 'IT311',
    name: 'System Integration and Architecture',
    section: 'BSIT 3A',
    enrolledCount: 32,
    messages: [
      {
        id: 'm1',
        senderName: 'You',
        senderRole: 'instructor',
        content: 'Welcome to IT311! Post your questions here anytime.',
        createdAt: minutesAgo(180),
        pinned: true,
      },
      {
        id: 'm2',
        senderName: 'Dela Cruz, J.',
        senderRole: 'student',
        content: 'Good day po sir, what time po ba tayo mag-uumpisa this week?',
        createdAt: minutesAgo(45),
        pinned: false,
      },
      {
        id: 'm3',
        senderName: 'You',
        senderRole: 'instructor',
        content: '9AM as usual, room ICT-2.',
        createdAt: minutesAgo(40),
        pinned: false,
      },
    ],
  },
  {
    id: 'sec-2',
    code: 'IT312',
    name: 'Information Assurance and Security',
    section: 'BSIT 3B',
    enrolledCount: 0,
    messages: [],
  },
  {
    id: 'sec-3',
    code: 'IT301',
    name: 'Application Development and Emerging Technologies',
    section: 'BSIT 3A',
    enrolledCount: 28,
    messages: [
      {
        id: 'm4',
        senderName: 'You',
        senderRole: 'instructor',
        content: 'Reminder: bring your laptops next meeting.',
        createdAt: minutesAgo(600),
        pinned: false,
      },
    ],
  },
]

export default mySubjects
