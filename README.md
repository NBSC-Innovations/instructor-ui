
# NBSC Instructor Portal — UI

Instructor-facing web app for the Group Chat Finder project. Gives each instructor a
searchable list of the sections they teach, and an in-app text chat per section that
students are automatically matched into.

This README documents the **current state of this repo only** — the Instructor UI.
It's a companion piece to the Student UI repo; a few decisions here (especially
around chat creation and student matching) depend on what the Student UI's COR/OCR
flow actually does, so expect this doc to need updates once that side is finalized.


## NBSC Instructor Portal

Standalone instructor-facing UI for GC Finder. Instructors can view their assigned sections, open a section chat, see enrolled members, send text messages, pin messages, and update their own profile.

This repository is independent. It does not import code or data from another project.

## Tech Stack

- React 19
- Vite
- Supabase Auth and Postgres
- Supabase Row Level Security (RLS)
- Plain CSS with NBSC theme variables

## Run Locally

### Requirements

- Node.js and npm
- A Supabase project using `src/database/supabase-schema-clean.sql`

### Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only the public Supabase URL and anon key belong in this frontend. Do not expose a service-role key in a browser build.

### Install and start

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Database Setup

Run `src/database/supabase-schema-clean.sql` in the Supabase SQL Editor. This is the current intended schema for this repository.

The script:

- Creates `profiles`, `courses`, `sections`, `section_enrollments`, and `gc_messages`.
- Creates user-role and enrollment-status enum types.
- Adds indexes and RLS policies.
- Creates the new-user profile trigger.
- Adds the email-domain auth hook function.
- Enables realtime for `gc_messages`.
- Creates backup tables before dropping the old schema.

After running the script, enable the `hook_restrict_to_nbsc_domain` function under Supabase Authentication Hooks using the Before User Created hook.

## Database Structure

The current schema is section-centered:

```text
profiles
  |-- sections.instructor_id
  |-- section_enrollments.student_id
  `-- gc_messages.sender_id

courses
  `-- sections.course_id

sections
  |-- section_enrollments.section_id
  `-- gc_messages.section_id
```

### Tables

#### `profiles`

One row per authenticated user.

Important fields:

- `id`: Auth user ID and primary key
- `full_name`: Display name
- `email`: Login email
- `role`: `student` or `instructor`
- `student_id`: Institutional student number for students
- `verified`, `is_admin`: Account-management fields

#### `courses`

Subject catalog. A course is not assigned directly to an instructor in the clean schema.

#### `sections`

The actual class instance.

Important fields:

- `id`: Section ID used by chat features
- `course_id`: Related catalog course
- `name`: Section code, such as `BSIT 3A`
- `instructor_id`: Instructor assigned to the section
- `room`, `max_capacity`, `current_enrollment`

#### `section_enrollments`

The source of truth for who belongs to a section.

- `student_id` references `profiles.id`
- `section_id` references `sections.id`
- `status` is `active` or `dropped`

#### `gc_messages`

Messages belong directly to a section.

- `section_id` identifies the chat
- `sender_id` references `profiles.id`
- `content` stores text
- `is_pinned` controls instructor pinning
- `is_deleted` hides deleted messages

There are no `group_chats` or `group_chat_members` tables in the clean schema.

## Application Structure

```text
src/
  App.jsx                 Auth, global state, page switching, chat actions
  App.css                 Application shell and layout
  index.css               Shared theme variables and global styles
  components/
    Sidebar.jsx           Main navigation and logout
  pages/
    Login.jsx             Authentication screen
    Dashboard.jsx         Overview and shortcuts
    MySubjects.jsx        Assigned-section management
    GroupChats.jsx        Section chat list
    ClassRoom.jsx         Chat screen and Members panel
    Profile.jsx           Instructor profile editor
  services/
    database.js           Supabase reads and writes
  styles/
    *.css                 Page and component styles
  utils/
    supabaseClient.js     Supabase browser client
    toast.jsx              Toast notifications
  database/
    supabase-schema-clean.sql  Current database schema
```

There is no router library. `App.jsx` uses `activePage` for the selected navigation page and `selectedSubjectId` for the open section chat.

## Runtime Flow

1. Supabase restores or creates the auth session.
2. `App.jsx` finds the instructor profile by email.
3. `fetchSectionsWithMessages(instructorId)` loads the instructor's sections.
4. For each section, the service loads:
   - Messages from `gc_messages` using `section_id`.
   - Student members from `section_enrollments` using `student_id`.
   - The instructor from `sections.instructor_id`.
5. The service converts database rows into the `subject` object consumed by the pages.
6. `ClassRoom.jsx` renders messages, pins, composer, and members.
7. Sending and pinning write to Supabase and update local React state.

## Subject Object

The main section object passed through the UI currently looks like this:

```js
{
  id: section.id,
  code: section.name,
  name: section.description || 'No description',
  courseId: section.course_id,
  enrolledCount: 3,
  members: [
    {
      id: profile.id,
      full_name: 'Student Name',
      email: 'student@nbsc.edu.ph',
      student_id: '12345',
      role: 'student',
      roleLabel: null
    },
    {
      id: instructor.id,
      full_name: 'Instructor Name',
      role: 'instructor',
      roleLabel: '(Instructor)'
    }
  ],
  messages: [
    {
      id: message.id,
      senderName: 'Student Name',
      senderRole: 'student',
      content: 'Hello',
      createdAt: message.created_at,
      pinned: false
    }
  ]
}
```

## Main Service Functions

All Supabase access should normally be added to `src/services/database.js` rather than directly inside page components.

- `fetchInstructorProfile(email)`: Loads the signed-in instructor profile.
- `fetchInstructorSections(instructorId)`: Loads sections assigned to the instructor.
- `fetchSectionMessages(sectionId)`: Loads messages and sender profiles for one section.
- `fetchSectionMembers(sectionId)`: Loads enrolled students and the section instructor.
- `fetchSectionsWithMessages(instructorId)`: Builds the complete subject objects used by the UI.
- `sendMessage(sectionId, senderId, content)`: Inserts a message into `gc_messages`.
- `toggleMessagePin(messageId, isPinned)`: Updates the pin state of a message.
- `updateInstructorProfile(profileId, updates)`: Updates the instructor's profile.

## Adding Features

### Chat features

Add the UI in `src/pages/ClassRoom.jsx`, styles in `src/styles/ClassRoom.css`, and database operations in `src/services/database.js`.

Keep chat records connected to `section_id`. Do not reintroduce course-level chat relationships or the old group-chat tables.

Examples:

- Reactions: add a `message_reactions` table with `message_id` and `user_id`.
- Read receipts: add a `message_reads` table with `message_id` and `user_id`.
- Attachments: use Supabase Storage plus a message-attachments table.
- Announcements: add an `announcements` table with `section_id`.
- Message search: query `gc_messages` by `section_id` and search text.

### New section-level features

Use `section_id` as the primary relationship. The normal pattern is:

1. Add a table or column to the clean schema.
2. Add the required foreign keys and indexes.
3. Add RLS policies for section instructors and enrolled students.
4. Add service functions in `database.js`.
5. Load the data in `App.jsx` or the relevant page.
6. Update local state after mutations so the UI responds immediately.

## Security and RLS

The clean schema uses the authenticated user's ID from `auth.uid()`.

Expected access rules:

- Instructors can access their own profile.
- Instructors can access sections where `sections.instructor_id = auth.uid()`.
- Instructors can read members assigned to their sections.
- Instructors can read, send, and pin messages in their sections.
- Students can access sections and messages where they have an active section enrollment.

Whenever adding a table, define its RLS policies in the migration. A frontend query cannot grant access that RLS denies.

## Current Caveats

The active instructor chat path uses the clean section-based schema. Some older service functions remain in `database.js` and still reference the previous course-based schema. Avoid using these for new features:

- `fetchCoursesWithMessages`
- `fetchCourseEnrollments`
- `fetchCourseEnrollmentCount`
- The old course-based message helpers

`fetchInstructorCourses()` also still expects `courses.instructor_id`, but the clean schema assigns instructors to `sections`, not courses. The section-based functions are the reliable path for the current instructor UI.

The clean `profiles` table does not currently contain `avatar_url`, so the Members panel uses initials as its normal fallback. Add that column and an RLS-safe storage strategy before implementing uploaded avatars.

## Scope

Currently included:

- Instructor authentication
- Assigned-section browsing
- Section group chat
- Message sending
- Instructor-only pinning
- Section Members panel
- Instructor profile editing

Not currently included:

- Assignments, grades, quizzes, or attendance
- Message search
- Unread counts or read receipts
- Realtime message subscriptions
- File or image messages
- Member management actions





