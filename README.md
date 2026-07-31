# NBSC Instructor UI

Standalone instructor-facing React application for GC Finder. This repository contains the instructor authentication flow, first-run section setup, assigned-section views, section chat, Members panel, message pinning, and instructor profile editing.

This document describes the current code and database assumptions so the features can be merged into the main web application without accidentally bringing back the older course-based section logic.

## What The App Does

An instructor can:

- Sign in with Supabase Auth using email/password or Google OAuth.
- Complete a first-run setup by entering the section codes they handle.
- Search existing section codes and claim unassigned sections.
- Create a new section by entering a code and subject title.
- View assigned sections and their enrolled student counts.
- Open a section chat.
- View all students and the instructor in the chat Members panel.
- Send text messages.
- Pin and unpin messages as the instructor.
- Edit Rank and College/Department in their profile.

The app does not create a separate classroom, group chat, or chat-membership row. A section is the classroom, and `gc_messages.section_id` connects messages directly to it.

## Tech Stack

- React 19
- Vite
- Supabase Auth
- Supabase Postgres and Row Level Security
- Plain CSS using the NBSC variables in `src/index.css`

## Run Locally

### Requirements

- Node.js and npm
- A Supabase project with the required tables, columns, and RLS policies already applied

### Environment

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only the public Supabase URL and anon key belong in the browser app. Never expose a service-role key in the frontend.

### Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Current Database Shape

The live section-assignment flow was checked against Supabase data. It does not use a course/section pair.

### Section rows

The important fields in `sections` are:

- `id`: Section primary key.
- `name`: The complete section code, for example `ICS79`.
- `description`: The human-readable subject title.
- `instructor_id`: The assigned instructor profile ID, or `NULL` when unassigned.
- `course_id`: Nullable and currently unused by the existing section rows.

There is one code input per setup row. Do not split it into `courseCode` and `sectionName`.

### Related tables

```text
profiles
  |-- sections.instructor_id
  |-- section_enrollments.student_id
  `-- gc_messages.sender_id

sections
  |-- section_enrollments.section_id
  `-- gc_messages.section_id
```

The active section setup and profile services query `sections` directly. They do not require a populated `courses` row or a `courses:course_id` relationship.

### `profiles`

Relevant fields:

- `id`
- `full_name`
- `email`
- `rank`
- `department`
- `role`
- `verified`

### `section_enrollments`

This is the source of truth for section membership:

- `student_id` references `profiles.id`.
- `section_id` references `sections.id`.
- The nested `id` rows are counted for the Profile Assigned Sections display and Members panel.

### `gc_messages`

Messages belong directly to a section:

- `section_id` references `sections.id`.
- `sender_id` references `profiles.id`.
- `content` stores the message text.
- `is_pinned` stores instructor pin state.
- `is_deleted` hides deleted messages.

Do not add `group_chats` or `group_chat_members` logic for this flow.

## Authentication And First-Run Gate

Authentication remains in `src/pages/Login.jsx`. `App.jsx` still owns session restoration and the auth listener:

1. `supabase.auth.getSession()` restores the persisted session.
2. `supabase.auth.onAuthStateChange()` reacts to sign-in and sign-out.
3. When there is no session, `App.jsx` renders `<Login />`.
4. When a session exists, `instructorService.fetchInstructorProfile(session.user.id)` loads the profile.
5. `instructorService.hasAssignedSections(profile.id)` checks whether the instructor owns at least one section.
6. While the check runs, App shows the existing loading state.
7. When the result is `false`, App renders `<InstructorSetup>` instead of the Sidebar and normal page shell.
8. When the result is `true`, App loads the normal sections, messages, and navigation shell.

Supabase client configuration uses `persistSession: true`, so a previously authenticated browser can open directly into setup or the normal app. Login appears when the session is absent, after logout, or in a fresh browser session.

## First-Run Instructor Setup

### Files

- `src/pages/InstructorSetup.jsx`: Full-page first-run wrapper.
- `src/components/InstructorSetupForm.jsx`: Form state and submission UI.
- `src/components/SectionCodeInput.jsx`: One section-code row.
- `src/hooks/useInstructorSetup.js`: Multi-row setup state and workflow.
- `src/services/classroomService.js`: Section lookup, claim, and create writes.
- `src/utils/sectionValidation.js`: Code and subject-title validation.
- `src/styles/InstructorSetup.css`: Setup-page and setup-form styling.

### Setup row shape

Each row contains one code:

```js
{
  id,
  code,
  suggestions,
  status,
  message
}
```

There is no `courseCode` or `sectionName` in the current setup flow.

### Setup behavior

1. The instructor types a section code such as `ICS79`.
2. Suggestions search `sections.name`.
3. Selecting a suggestion fills the single `code` field.
4. Submitting calls `resolveSectionByCode(code)`.
5. An unassigned existing row is claimed by setting `sections.instructor_id`.
6. A row assigned to the current instructor shows `Already assigned to you.`.
7. A row assigned to another instructor is rejected.
8. A missing code opens a confirmation prompt that requires a subject title.
9. Confirming creates one `sections` row with:

```js
{
  name: normalizedCode,
  description: title,
  instructor_id: currentUser.id
}
```

`course_id` is intentionally omitted and remains `NULL`.

The setup completion callback rechecks `hasAssignedSections` and then loads the normal app. The classroom service does not create a chat entity because the section row itself is the classroom.

## Profile Page

`src/pages/Profile.jsx` is intentionally display-oriented.

### Read-only information

- Name
- Email
- Assigned Sections

Assigned Sections are loaded by `instructorService.fetchAssignedSections(instructorId)` and rendered from this shape:

```js
{
  id,
  code,
  title,
  enrolledCount
}
```

The list displays the code, subject title, and enrolled count. It does not claim, create, or modify sections.

### Editable information

- Rank
- College/Department

These fields are saved using `instructorService.updateInstructorProfile(profileId, updates)`. Profile does not call `classroomService`.

The old `SectionCodesField.jsx` component was deleted. Section assignment belongs only to the first-run `InstructorSetup` flow.

## Service Boundaries

### `src/services/instructorService.js`

Profile and read-only assignment queries:

- `fetchInstructorProfile(userId)`: Loads the current profile by Auth user ID.
- `updateInstructorProfile(userId, updates)`: Updates only `rank`, `department`, and `full_name`.
- `hasAssignedSections(instructorId)`: Returns a boolean based on assigned section count.
- `fetchAssignedSections(instructorId)`: Returns `{ id, code, title, enrolledCount }` rows for Profile.

### `src/services/classroomService.js`

The only assignment write service:

- `suggestSections(query)`: Searches `sections.name`.
- `resolveSectionByCode(code)`: Finds an existing section and returns `unclaimed`, `already_yours`, `taken`, or `not_found`.
- `claimSection(sectionId)`: Claims an unassigned section.
- `createSection(code, title)`: Inserts directly into `sections` with `course_id` omitted.

This service does not create `group_chats`, classroom records, or membership records.

### `src/utils/sectionValidation.js`

- `normalizeCode(value)`: Trims, collapses spaces, and uppercases the code.
- `isValidCode(code)`: Requires a non-empty code with a maximum length of 20.
- `isValidTitle(title)`: Requires a non-empty subject title with a maximum length of 120.

### Existing chat service path

The active chat data path remains in `src/services/database.js` and `src/App.jsx`:

- Sections are loaded for the instructor.
- Messages are loaded from `gc_messages` by `section_id`.
- Sender profiles are joined through `sender_id`.
- Members are loaded from `section_enrollments` and the section instructor profile.
- Sending inserts into `gc_messages` with `section_id`.
- Pinning updates `gc_messages.is_pinned`.

`ClassRoom.jsx` renders the chat and Members panel. Its section behavior was not changed by the single-code setup correction.

## Main Application Structure

```text
src/
  App.jsx
    Auth/session restoration, first-run gate, global state, page switching
  components/
    InstructorSetupForm.jsx
    SectionCodeInput.jsx
    Sidebar.jsx
  hooks/
    useInstructorSetup.js
  pages/
    Login.jsx
    InstructorSetup.jsx
    Dashboard.jsx
    MySubjects.jsx
    GroupChats.jsx
    ClassRoom.jsx
    Profile.jsx
  services/
    instructorService.js
    classroomService.js
    database.js
  styles/
    InstructorSetup.css
    Profile.css
    ClassRoom.css
    other page styles
  utils/
    sectionValidation.js
    supabaseClient.js
    toast.jsx
```

There is no router library. `App.jsx` uses `activePage` and `selectedSubjectId` to choose the current view.

## Integration Guide For The Main Web App

When merging these features into the main web application:

1. Copy the instructor setup files and preserve their imports:
   - `InstructorSetup.jsx`
   - `InstructorSetupForm.jsx`
   - `SectionCodeInput.jsx`
   - `useInstructorSetup.js`
   - `classroomService.js`
   - `sectionValidation.js`
   - `InstructorSetup.css`
2. Copy the instructor service functions or merge their equivalent functions into the main service layer.
3. Add `rank` to the profile query and profile state.
4. Add `rank` and `department` to the profile update payload.
5. Add the `hasAssignedSections` check after auth profile loading and before rendering the normal app shell.
6. Render the setup page when the check is false.
7. Recheck the assignment after setup completion.
8. Keep Profile read-only for assignment data; do not put claim/create actions in Profile.
9. Preserve the one-code data contract: `sections.name` is the code and `sections.description` is the title.
10. Preserve `section_id` as the relationship for chat messages.
11. Do not introduce a courses-table join into the setup or Profile assignment flow.
12. Preserve the existing RLS policies already supporting section claims, course inserts if needed elsewhere, and section inserts.
13. Verify the main app's existing route/navigation conventions before adding any router abstraction. This standalone app does not use React Router.

## Course-Join Risks And Legacy Code

The live section-assignment flow does not depend on `courses`. However, this repository still contains older code that assumes a populated `sections.course_id` and a related courses row.

These files/functions should be reviewed separately before merging:

- `src/services/sectionAssignment.js`: Legacy two-field `courseCode` plus `sectionName` flow, including `courses: (...)` joins and course-based section creation.
- `src/services/database.js`:
  - `fetchCourseSections(courseId)` uses course IDs.
  - `fetchCourseEnrollmentCount(courseId)` uses the old `enrollments` table.
  - `fetchCourseEnrollments(courseId)` uses course enrollment rows.
  - `fetchCoursesWithMessages(instructorId)` uses old course/message assumptions.
  - `createSection(sectionData)` expects course-related fields and old section columns.
  - `fetchInstructorSections()` contains a `courses:course_id` nested select.
  - Other student-facing helpers use `course_id` and course joins.
- `App.jsx` still imports older database helpers for the normal instructor shell. The active setup/profile correction does not silently rewrite those helpers because they may represent a separate migration issue.

Before merging into the main web app, decide whether the main app is also moving to the live single-code section model. If it is, audit and replace these legacy functions deliberately rather than mixing both contracts.

## RLS And Security Expectations

Do not change RLS as part of the frontend merge unless the database owner explicitly plans a separate migration. The current setup relies on policies that allow the authenticated instructor to:

- Read sections needed for suggestions and resolution.
- Claim only an unassigned section.
- Insert a new section assigned to the current user.
- Read their assigned sections and section enrollment counts.
- Read, send, and pin messages for their sections.

The frontend cannot grant access that Supabase RLS denies. Test setup actions with a real authenticated instructor account.

## Scope And Non-Changes

The single-code correction did not modify:

- RLS policies.
- The `profiles.rank` schema column.
- `ClassRoom.jsx`.
- `MySubjects.jsx`.
- The earlier Members panel behavior.
- The App session-restore and auth-listener logic.
- The database schema.

Not currently included:

- Assignments, grades, quizzes, or attendance.
- Message search.
- Unread counts or read receipts.
- File/image messages.
- Member management actions.
- Realtime message subscriptions in the active chat UI.

## Validation

Run the following before merging:

```bash
npm run build
npm run lint
```

The production build should complete successfully. A Vite warning may appear because `src/services/database.js` is both statically imported by `App.jsx` and dynamically imported by `MySubjects.jsx`; this warning is unrelated to the single-code setup flow.
