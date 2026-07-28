# Student Communication Guide

This guide explains how students can communicate within the NBSC Group Chat Finder system and outlines the common functionality that should be available on both instructor and student interfaces.

---

## Overview

The communication system is designed to facilitate seamless interaction between instructors and students within course sections. Each course section has its own dedicated group chat that is automatically created when students are enrolled.

---

## How Group Chats Reflect in the Instructor Interface

### Instructor View of Group Chats

Instructors see group chats in three main locations:

1. **Dashboard**: Shows a summary of active sections and the 3 most recent chats with message previews
2. **My Subjects**: Lists all assigned sections with their enrollment status:
   - Sections with `enrolledCount > 0`: Shows "Enter" button to access the active chat
   - Sections with `enrolledCount === 0`: Shows "Waiting for students" (chat not yet created)
3. **Group Chats**: Dedicated view showing all active conversations, sorted by most recent message

### Chat Creation Logic

- **Automatic creation**: A group chat is automatically created when a course is created in the database
- **Instructor auto-join**: When a course is created, the instructor is automatically added as a member of the group chat
- **Student auto-join**: When a student enrolls in a course with status='active', they are automatically added to the group chat
- **No manual setup**: Instructors do not need to manually create chats or add students - everything is handled by database triggers
- **Real-time sync**: When a student enrolls, the chat immediately becomes visible to the instructor via the enrollment trigger

### Database Implementation

The group chat system uses the following database tables and triggers:

**Tables:**
- **group_chats**: Stores one chat per course (linked via `course_id`)
- **group_chat_members**: Tracks membership (links users to chats via `group_chat_id` and `user_id`)
- **gc_messages**: Stores all messages (linked to course via `course_id`)

**Automatic Triggers:**
1. **Course Creation Trigger**: When a course is created, a group chat is automatically created with the name `{course_code} - {course_title}`, and the instructor is added as a member
2. **Enrollment Trigger**: When a student enrolls with status='active', they are automatically added to the corresponding course's group chat

This ensures that:
- Every course has exactly one group chat
- Instructors are automatically members of their course chats
- Students are automatically added when they enroll
- No manual chat management is required

### Instructor Chat Features

When an instructor enters a course chat (ClassRoom view), they can:

- **View all messages**: See the complete conversation history with student names and timestamps
- **Send messages**: Post announcements, answer questions, share links
- **Pin messages**: Mark important messages as pinned (instructor-only feature) - these appear at the top of the chat for all participants
- **See enrollment count**: View how many students are in the section
- **Navigate back**: Return to the list of chats or subjects

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

- **Course-based**: Each course section has its own dedicated chat
- **Automatic enrollment**: Students are automatically added to chats when enrolled in a section
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
| **Course-based chats** | ✅ | ✅ | One chat per section |

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
| **Dashboard overview** | ✅ | ✅ | Summary of active chats |
| **My Subjects list** | ✅ | ✅ | All enrolled/assigned courses |
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

1. **Pin important updates**: Use pinning for announcements, deadlines, and critical information
2. **Set expectations**: Communicate response times and preferred communication channels
3. **Moderate discussions**: Keep conversations focused and productive
4. **Share external links**: Use the chat to direct students to external platforms (Facebook groups, Messenger, etc.)

---

## Technical Implementation Notes

### Database Structure

Both instructor and student interfaces share the same database tables:

- **gc_messages**: Stores all chat messages with sender information
- **group_chats**: Represents each course's group chat
- **group_chat_members**: Tracks membership in each chat
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

The communication system is designed to be **symmetrical** between instructor and student interfaces, with role-specific features (like instructor-only pinning) where appropriate. The core messaging functionality—sending, receiving, and viewing messages—should behave identically on both sides to ensure a consistent user experience.

Key principles:
- **Automatic chat creation**: Chats are generated when students enroll
- **Text-first approach**: Keep the database light with text-only messaging
- **Real-time sync**: Both sides receive updates instantly
- **Role-based permissions**: Instructors have moderation tools, students have participation tools
- **Shared infrastructure**: Same database, same real-time system, same design language
