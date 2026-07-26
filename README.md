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
- **Supabase** (Auth, Postgres, RLS) — planned, **not yet connected**. Everything in
  this repo currently runs on local mock state (see "Mock data" below).
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
  data/
    mySubjects.js       MOCK DATA — sections, enrollment counts, chat messages
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

## Mock Data — `src/data/mySubjects.js`

Every page currently reads from `mySubjectsData`, held in `App.jsx` state
(`subjects`). It simulates:

```js
{
  id, code, name, section, enrolledCount,
  messages: [{ id, senderName, senderRole, content, createdAt, pinned }]
}
```

This is **not** how the real data should be fetched — see below.

---

## Backend Integration Points (Supabase — not built yet)

These are the specific spots in the code with `TODO` comments marking where mock
state needs to become a real Supabase call:

| File | What it fakes now | What it should become |
|---|---|---|
| `data/mySubjects.js` | Hardcoded array | Query: sections assigned to the logged-in instructor for the active term, joined with enrollment counts |
| `App.jsx` → `handleSendMessage` | Appends to local state | Insert into a `messages` table |
| `App.jsx` → `handleTogglePin` | Toggles local state | Update the `pinned` column on that message |
| `App.jsx` → `handleSaveProfile` | Updates local state | Update on the instructor's `InstructorProfiles` row |
| `App.jsx` → `handleLogout` | `console.log` only | `supabase.auth.signOut()` |
| `ClassRoom.jsx` | Loads all messages for a section at once | Should be paginated (most recent N, load older on scroll) — do this **before** adding Realtime, not after; get plain fetch/insert correct first |
| Chat delivery (not built) | N/A | Supabase Realtime subscription per open section, added only after the above works |

**On the instructor↔section assignment problem specifically:** since there's no
SIS integration, the realistic options are (a) instructor self-claims a section via
search, or (b) self-claim + admin/CSG approval before it grants chat access. Given
that a claim now grants entry into a live chat with real students (not just a
passive link), leaning toward requiring some verification step is safer — this
needs a decision from the team, not just from this UI.

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

```bash
npm install
npm run dev
```

Standard Vite dev server. No environment variables needed yet since there's no
backend connection — that'll change once Supabase is wired in (client keys, etc.
will need a `.env` at that point, not committed to the repo).