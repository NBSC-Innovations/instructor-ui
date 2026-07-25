// src/data/mySubjects.js
//
// TEMP MOCK DATA — replace with a Supabase query once the backend/schema is ready.
// Expected real query: sections where instructor_id = current logged-in instructor's id,
// joined with subjects (code, name) and a count of studentEnrollments for that section.
//
// Shape to keep when you wire up the real data:
//   id            -> section id (not just subject code, since one subject can have
//                     multiple sections/instructors — keep this unique per section)
//   code          -> subject code, e.g. "IT311"
//   name          -> subject name
//   section       -> section label, e.g. "BSIT 3A"
//   enrolledCount -> number of students currently matched to this section
//   gcLink        -> the group chat link the instructor has set, empty string if none yet

const mySubjects = [
  {
    id: 'sec-1',
    code: 'IT311',
    name: 'System Integration and Architecture',
    section: 'BSIT 3A',
    enrolledCount: 32,
    gcLink: 'https://m.me/sample-it311-3a',
  },
  {
    id: 'sec-2',
    code: 'IT312',
    name: 'Information Assurance and Security',
    section: 'BSIT 3B',
    enrolledCount: 0,
    gcLink: '',
  },
  {
    id: 'sec-3',
    code: 'IT301',
    name: 'Application Development and Emerging Technologies',
    section: 'BSIT 3A',
    enrolledCount: 28,
    gcLink: '',
  },
]

export default mySubjects
