# Student Communication Guide

This guide explains how students can communicate within the NBSC Group Chat Finder system and outlines the common functionality that should be available on both instructor and student interfaces.

---

## Overview

The communication system is designed to facilitate seamless interaction between instructors and students within course sections. Each section has its own dedicated group chat that is automatically created when the section is created by the instructor.

---

## How Group Chats Reflect in the Instructor Interface

### Instructor View of Group Chats

Instructors see group chats in three main locations:

1. **Dashboard**: Now displays the Group Chats page as the default view, showing all active conversations sorted by most recent message
2. **My Subjects**: Lists all assigned sections with their enrollment status:
   - Sections with `enrolledCount > 0`: Shows "Enter" button to access the active chat
   - Sections with `enrolledCount === 0`: Shows "Waiting for students" (chat not yet created)
   - Section Management: Dedicated section for creating, editing, and deleting sections with section codes and descriptions
3. **Group Chats**: Dedicated view showing all active conversations, sorted by most recent message

### Chat Creation Logic

- **Section-based chats**: Group chats are now created per section instead of per course
- **Manual section creation**: Instructors create sections manually with section codes (e.g., "BSIT 3A") and subject descriptions
- **Automatic course creation**: When a section is created, a corresponding course is automatically created for group chat compatibility
- **Instructor auto-join**: When a section is created, the instructor is automatically added as a member of the group chat
- **Student auto-join**: When a student matches a section code on the student side, they are automatically added to the corresponding group chat
- **No manual chat setup**: Instructors do not need to manually create chats - everything is handled when sections are created
- **Real-time sync**: When a student joins a section, the chat immediately becomes visible to the instructor

### Database Implementation

The group chat system uses the following database tables and triggers:

**Tables:**
- **sections**: Stores section information including section code, description, schedule, room, and capacity
- **courses**: Stores course information (automatically created when sections are created)
- **enrollments**: Tracks student enrollment in courses
- **gc_messages**: Stores all messages (linked to course via `course_id`)

**Section Creation Process:**
1. **Manual Section Creation**: Instructors create sections via a modal form with:
   - Section Code (e.g., "BSIT 3A")
   - Subject Description (e.g., "System Integration and Architecture")
   - Schedule (optional)
   - Room (optional)
   - Max Capacity (default: 40)
2. **Automatic Course Creation**: When a section is created, a corresponding course is automatically created with the same code and description
3. **Section-Course Link**: The section is linked to the course for group chat compatibility

This ensures that:
- Every section has exactly one group chat (via the linked course)
- Instructors can manage sections independently
- Students can join by matching section codes
- No manual chat management is required

### Instructor Chat Features

When an instructor enters a section chat (ClassRoom view), they can:

- **View all messages**: See the complete conversation history with student names and timestamps
- **Send messages**: Post announcements, answer questions, share links
- **Pin messages**: Mark important messages as pinned (instructor-only feature) - these appear at the top of the chat for all participants
- **See enrollment count**: View how many students are in the section
- **Navigate back**: Return to the list of chats or subjects
- **View section details**: Chat header displays section code, subject description, and current date

### Message Visibility

- **Instructor messages**: Displayed with a special "instructor" styling to distinguish from student messages
- **Student messages**: Show the student's name for identification
- **Pinned messages**: Displayed in a dedicated section at the top of the chat for both instructors and students

---

## How Students Can Communicate

### 1. **Accessing Group Chats**

Students can access their course group chats through:
- **Dashboard**: Shows all enrolled courses with active chats
- **My Subjects**: View all enrolled courses and their chat status
- **Group Chats**: Dedicated view for active conversations, sorted by most recent activity

### 2. **Sending Messages**

- **Text-only messaging**: Send plain text messages to the entire class
- **Link sharing**: Paste external links (e.g., Messenger groups, Facebook pages, resources)
- **Real-time delivery**: Messages appear instantly for all participants
- **Message history**: Full conversation history is preserved

### 3. **Message Features**

- **Timestamps**: Each message shows when it was sent
- **Sender identification**: Messages display the sender's name
- **Pinned messages**: Important announcements can be pinned by instructors (currently instructor-only)
- **Message replies**: Reply to specific messages for context (planned feature)

### 4. **Chat Organization**

- **Section-based**: Each section has its own dedicated group chat
- **Section code matching**: Students join chats by matching section codes entered by instructors
- **Automatic enrollment**: Students are automatically added to chats when they match a section code
- **Active vs waiting**: Chats appear as "active" once students are enrolled

---

## Common Functionality (Both Instructor and Student Sides)

### Core Communication Features

| Feature | Instructor | Student | Notes |
|---------|-----------|---------|-------|
| **Send messages** | ✅ | ✅ | Text-only, real-time |
| **View message history** | ✅ | ✅ | Full conversation history |
| **See sender names** | ✅ | ✅ | Displayed on each message |
| **Timestamps** | ✅ | ✅ | Time sent on each message |
| **Link sharing** | ✅ | ✅ | Paste external links |
| **Real-time updates** | ✅ | ✅ | Via Supabase Realtime |
| **Section-based chats** | ✅ | ✅ | One chat per section |

### Message Management

| Feature | Instructor | Student | Notes |
|---------|-----------|---------|-------|
| **Pin messages** | ✅ | ❌ | Currently instructor-only |
| **Edit messages** | 🔄 | 🔄 | Planned feature |
| **Delete messages** | 🔄 | 🔄 | Planned feature |
| **Reply to messages** | 🔄 | 🔄 | Planned feature |
| **Search messages** | 🔄 | 🔄 | Planned feature |

### Navigation & Discovery

| Feature | Instructor | Student | Notes |
|---------|-----------|---------|-------|
| **Dashboard overview** | ✅ | ✅ | Shows Group Chats as default view |
| **My Subjects list** | ✅ | ✅ | All enrolled/assigned sections |
| **Section Management** | ✅ | ❌ | Create/edit/delete sections (instructor-only) |
| **Group Chats view** | ✅ | ✅ | Sorted by recent activity |
| **Quick access to recent** | ✅ | ✅ | Most recent conversations |

### Read State & Notifications

| Feature | Instructor | Student | Notes |
|---------|-----------|---------|-------|
| **Unread message badges** | ❌ | ❌ | Deferred (needs read-state tracking) |
| **Last read tracking** | ❌ | ❌ | Planned for accurate unread counts |
| **Push notifications** | ❌ | ❌ | Future enhancement |

---

## Communication Best Practices

### For Students

1. **Keep messages relevant**: Post content related to the course material, assignments, or class logistics
2. **Be respectful**: Maintain professional communication with instructors and classmates
3. **Use pinned messages**: Check pinned messages first for important announcements
4. **Share resources appropriately**: Use link sharing for external resources (study groups, reference materials)
5. **Avoid spam**: Don't flood the chat with unrelated content

### For Instructors

1. **Create sections properly**: Use descriptive section codes and subject descriptions to help students identify their correct sections
2. **Pin important updates**: Use pinning for announcements, deadlines, and critical information
3. **Set expectations**: Communicate response times and preferred communication channels
4. **Moderate discussions**: Keep conversations focused and productive
5. **Share external links**: Use the chat to direct students to external platforms (Facebook groups, Messenger, etc.)
6. **Manage sections**: Regularly review and update section information (schedule, room, capacity)

---

## Technical Implementation Notes

### Database Structure

Both instructor and student interfaces share the same database tables:

- **sections**: Stores section information (code, description, schedule, room, capacity)
- **courses**: Stores course information (automatically created from sections)
- **enrollments**: Tracks student enrollment in courses
- **gc_messages**: Stores all chat messages with sender information
- **profiles**: User information for both instructors and students

### Real-time Updates

Both sides use **Supabase Realtime** subscriptions to:
- Receive new messages instantly
- Update message read state (when implemented)
- Sync pinned message status

### Access Control

**Row Level Security (RLS)** ensures:
- Students can only access chats for courses they're enrolled in
- Instructors can only access chats for courses they teach
- Message visibility is properly scoped by user role

---

## Future Enhancements

### Planned Features

1. **Message editing**: Allow users to edit their own messages within a time window
2. **Message deletion**: Allow users to delete their own messages
3. **Reply threading**: Reply to specific messages with threaded conversations
4. **In-chat search**: Search through message history by keyword or sender
5. **Read receipts**: Show when messages have been read
6. **Unread badges**: Display unread message counts with accurate tracking
7. **Message reactions**: Add emoji reactions to messages
8. **File attachments**: Support for document sharing (with size limits)

### Considerations for Student-Side Features

- **Student pinning**: Consider allowing students to pin messages (currently instructor-only)
- **Anonymous questions**: Optional mode for students to ask questions without revealing identity
- **Direct messaging**: Private messages between students and instructor (not student-to-student)
- **Study group creation**: Allow students to create sub-groups within a course

---

## Integration Points

### Student UI → Instructor UI

The student interface should:
- Use the same database schema and tables
- Implement the same message structure (gc_messages)
- Support the same real-time subscription patterns
- Follow the same RLS policies for data access

### Common Design System

Both interfaces should:
- Share CSS custom properties for consistent theming
- Use the same message bubble styling
- Implement similar navigation patterns
- Maintain visual consistency across components

---

## Summary

The communication system is designed to be **symmetrical** between instructor and student interfaces, with role-specific features (like instructor-only section management and pinning) where appropriate. The core messaging functionality—sending, receiving, and viewing messages—should behave identically on both sides to ensure a consistent user experience.

Key principles:
- **Section-based chats**: Chats are generated when instructors create sections
- **Manual section creation**: Instructors create sections with codes and descriptions
- **Section code matching**: Students join by matching section codes
- **Text-first approach**: Keep the database light with text-only messaging
- **Real-time sync**: Both sides receive updates instantly
- **Role-based permissions**: Instructors have section management and moderation tools, students have participation tools
- **Shared infrastructure**: Same database, same real-time system, same design language
