# NBSC Instructor Portal — UI

Instructor-facing web app for the Group Chat Finder project. Gives each instructor a
searchable list of the sections they teach, and an in-app text chat per section that
students are automatically matched into.

This README documents the **current state of this repo only** — the Instructor UI.
It's a companion piece to the Student UI repo; a few decisions here (especially
around chat creation and student matching) depend on what the Student UI's COR/OCR
flow actually does, so expect this doc to need updates once that side is finalized.

---

## What this is (and isn't)

- **Is:** a lightweight tool for instructors to find their assigned sections and
  chat with the students matched into them.
- **Is not:** a full LMS. No assignments, quizzes, attendance, grades, or grading
  tools are in scope. Resist adding dashboard widgets or nav items for these — see
  "Scope notes" below for why.

---

## Tech Stack

- **React + Vite**
- **Supabase** (Auth, Postgres, RLS) — **connected and active**. All data is fetched
  from the database using the service functions in `src/services/database.js`.
- Plain CSS (no framework) using a shared set of CSS custom properties for the NBSC
  navy theme — see `src/index.css`.

---

## Project Structure

```
src/
  components/
    Sidebar.jsx        Nav shell: Dashboard / My Subjects / Group Chats / Profile
  pages/
    Dashboard.jsx       Summary widgets + recent chats shortcut
    MySubjects.jsx      Searchable list of assigned sections
    GroupChats.jsx       Recent/active conversations, sorted by last message
    ClassRoom.jsx        The actual chat screen (opened from any of the above)
    Profile.jsx           Instructor's own profile (view/edit)
  services/
    database.js         Supabase database operations (fetch profiles, sections, messages)
  styles/
    *.css               One stylesheet per page/component
  App.jsx               Top-level state + routing between pages
  App.css / index.css    Layout shell + shared theme variables
```

There is no router library in use — `App.jsx` holds `activePage` and
`selectedSubjectId` in state and switches what renders based on those. Simple by
design, since the page count is small; revisit if this grows.

---

## Current Scope, Confirmed Logic

A few decisions that shape the code and are worth knowing before changing anything:

- **A section's chat auto-generates the moment the first student is matched into
  it.** There is no manual "create chat" step for the instructor. In `MySubjects.jsx`
  this means there are only two states per section: `enrolledCount === 0` → "Waiting
  for students", or `enrolledCount > 0` → "Enter" (chat is guaranteed to exist).
- **Chat is text-only.** No images/video, to keep the database light. Pasting links
  as plain text messages is fine (e.g. an instructor migrating a class to an
  external Messenger/Facebook GC pastes the link and can pin it).
- **Pinning is instructor-only for now** — see `ClassRoom.jsx`. Worth revisiting
  with the team if students should ever pin their own messages.
- **Department is descriptive only, not an access-control rule.** An instructor's
  `department` field (see `Profile.jsx`) is shown for directory purposes but must
  never be used to compute which sections they can access — NBSC's actual structure
  has departments (DGEC, and possibly CSS/RSS/NSTP/PATHFIT/MATH) that teach across
  multiple institutes, so any "department implies these sections" rule will be
  wrong. Section access should be an **explicit instructor↔section assignment**,
  not derived from department. See the "Backend integration points" section below.

---

## Database Integration (Supabase)

The application is now fully connected to Supabase using a comprehensive student management system schema. All data operations are handled through service functions in `src/services/database.js`:

### Database Tables

- **profiles**: Stores user information (id, email, full_name, role, student_id, department, avatar_url, bio)
- **courses**: Stores course information (id, code, title, description, instructor_id, department, credits, max_students, current_students, semester, academic_year, schedule, is_active)
- **sections**: Stores section information (id, course_id, name, instructor_id, schedule, room, max_capacity, current_enrollment)
- **enrollments**: Tracks student enrollments (id, student_id, course_id, status, enrolled_at, completed_at, final_grade)
- **gc_messages**: Stores group chat messages (id, course_id, sender_id, content, created_at, edited_at, is_deleted, reply_to)
- **group_chats**: Stores group chat information (id, course_id, name, created_at)
- **group_chat_members**: Tracks group chat memberships (id, group_chat_id, user_id, joined_at)

### Service Functions

- `fetchInstructorProfile(email)`: Fetch instructor profile by email from profiles table
- `fetchInstructorCourses(instructorId)`: Fetch all courses for an instructor
- `fetchCourseSections(courseId)`: Fetch sections for a specific course
- `fetchCourseMessages(courseId)`: Fetch messages for a specific course from gc_messages table
- `sendMessage(courseId, senderId, content)`: Send a new message to a course
- `updateInstructorProfile(profileId, updates)`: Update instructor profile in profiles table
- `fetchCoursesWithMessages(instructorId)`: Fetch complete course data with messages for instructor

### Row Level Security (RLS)

The database implements comprehensive RLS policies to ensure:
- Instructors can only access their own profile
- Instructors can only view and manage their assigned courses
- Instructors can only read messages from courses they teach
- Students can only access their enrolled courses and messages
- All data access is properly scoped based on user roles and relationships

---

## Design System

Shared theme lives in `src/index.css` as CSS custom properties (`--nbsc-blue-*`,
`--bg-app`, `--border`, `--text-h`, etc.) — reuse these rather than hardcoding
colors in new components, so the Instructor and Student UIs stay visually
consistent (this repo's components were originally copied from the Student UI for
that reason).

Content is wrapped in a `.page-container` (max-width 1180px, see `App.css`) so
layouts stay readable on wide desktop monitors instead of stretching edge-to-edge.
Sidebar collapses into a mobile drawer under 1024px — see `Sidebar.css`.

---

## Known Loose Ends / Not Yet Decided

- `FacebookPages.jsx` / `facebookPages.js` / `FacebookPages.css` are leftover files
  copied from the Student UI (an official-college-pages directory) — unused here.
  Safe to delete from this repo once confirmed nothing else references them.
- No unread-message badges yet — deliberately deferred, since accurate unread
  counts need real per-user read-state tracking, and a fake/wrong badge is worse
  than no badge.
- In-chat search is a "should-have," not built yet — will matter once a section's
  chat has a semester's worth of history.
- **Depends on the Student UI's OCR/COR-scan flow** (README for that side coming
  separately): the exact mechanics of "a student matched into a section triggers
  chat auto-generation" live on the student-side matching logic, not here — if that
  flow changes, the two-state logic in `MySubjects.jsx` may need to change with it.

---

## Running Locally

### Prerequisites

1. Node.js and npm installed
2. Supabase project set up with the database schema

### Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create:
   - Comprehensive database tables (profiles, courses, sections, enrollments, gc_messages, etc.)
   - Row Level Security policies
   - Functions and triggers for automatic profile creation and group chat management
   - Helper views for dashboards
   - Realtime subscriptions for gc_messages

4. Create a Supabase Auth user with email `20231025@nbsc.edu.ph`:
   - Go to Authentication > Users
   - Click "Add user" and create a user with email `20231025@nbsc.edu.ph`
   - Set a password and enable email confirmation
   - The profile will be automatically created by the `handle_new_user` trigger

5. After creating the auth user, run the test data section at the bottom of `supabase-schema.sql`:
   - This will create test courses (IT311, IT312, IT301)
   - Create test sections
   - Add sample messages for testing

6. Configure your `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation & Running

```bash
npm install
npm run dev
```

### Development

Standard Vite dev server. The application connects to Supabase using the credentials
in your `.env` file.