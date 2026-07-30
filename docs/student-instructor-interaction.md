# Student-Instructor Interaction Flow

## Overview
This document describes how students and instructors interact within the NBSC Instructor Portal system, including course enrollment, group chat communication, and real-time availability status.

## User Roles

### Instructor
- Can create and manage courses
- Can view enrolled students
- Can send messages in course group chats
- Can post announcements
- Can grade assignments
- Google OAuth login required

### Student
- Can view available courses
- Can enroll in courses
- Can participate in course group chats
- Can view announcements
- Can submit assignments
- OCR-based schedule extraction for course matching

## Course Creation and Assignment

### Instructor Creates Course
1. Instructor logs in via Google OAuth
2. System creates/updates instructor profile automatically
3. Instructor creates course with:
   - Subject code (e.g., CS101, IT201)
   - Course title
   - Description
   - Schedule (days, time, room)
   - Semester and academic year
4. System automatically creates group chat for the course
5. Course appears in instructor's dashboard

### Student Course Matching
1. Student extracts schedule from OCR (image/document)
2. System parses subject codes from OCR data
3. System matches extracted codes with available courses
4. Student enrolls in matched courses
5. Student appears in course group chat

## Group Chat Communication

### Message Flow
```
Instructor → Course Group Chat → All Enrolled Students
Student → Course Group Chat → Instructor + Other Students
```

### Message Types
- **General questions**: Students ask about assignments, deadlines
- **Announcements**: Instructor posts important updates
- **Technical support**: Students help each other
- **Schedule changes**: Instructor notifies of room/time changes

### Real-time Updates
- Messages appear instantly for all chat members
- Unread message count shown in dashboard
- Last message preview displayed in course list

## Instructor Availability Status

### Online Status
- **Green dot**: Instructor is actively using the system
- **Last seen**: Timestamp when instructor was last active
- Auto-updates every 5 minutes while active

### Offline/Not Created
When instructor is not in the system or hasn't created an account:

#### Student View
- Display message: "Instructor not currently available"
- Show "Last seen: [timestamp]" if previously active
- Option to send message (will be delivered when instructor returns)
- Display instructor's department and office hours (if available)

#### Handling Missing Instructor
1. **Instructor account not created**:
   - Show: "Instructor account not yet created"
   - Display: "Contact [department] for assistance"
   - Allow message queuing for when instructor joins

2. **Instructor offline**:
   - Show: "Instructor is currently offline"
   - Display: "Last seen: [relative time]"
   - Messages stored and delivered on next login

3. **Instructor on leave**:
   - Show: "Instructor is on leave until [date]"
   - Display substitute instructor if assigned
   - Redirect to department contact if urgent

## OCR Integration

### Student Schedule Extraction
1. Student uploads schedule image/document
2. OCR extracts text including:
   - Subject codes (CS101, IT201, etc.)
   - Days and times
   - Room numbers
3. System matches extracted codes with course database
4. Student confirms enrollment in matched courses

### Data Flow
```
OCR Input → Text Extraction → Code Parsing → Course Matching → Enrollment
```

### Error Handling
- **No matches found**: Suggest available courses
- **Partial matches**: Show matched and unmatched codes
- **Invalid codes**: Highlight for manual review
- **Duplicate enrollments**: Skip already enrolled courses

## Database Schema

### Key Tables
- `profiles`: User information (students and instructors)
- `courses`: Course details with instructor assignment
- `enrollments`: Student-course relationships
- `group_chats`: One per course
- `gc_messages`: Chat messages per course
- `group_chat_members`: Chat membership

### Relationships
```
profiles (instructor) → courses (instructor_id)
profiles (student) → enrollments (student_id)
courses → group_chats (course_id)
group_chats → gc_messages (course_id)
profiles → group_chat_members (user_id)
```

## API Endpoints

### Student Operations
- `POST /api/ocr/extract` - Extract schedule from image
- `GET /api/courses/available` - Get available courses
- `POST /api/enrollments` - Enroll in course
- `GET /api/messages/:courseId` - Get chat messages
- `POST /api/messages` - Send message

### Instructor Operations
- `POST /api/courses` - Create course
- `GET /api/courses/:id/students` - View enrolled students
- `POST /api/announcements` - Post announcement
- `GET /api/instructor/status` - Update availability status

## Security Considerations

### RLS Policies
- Students can only view their enrolled courses
- Instructors can only view their assigned courses
- Chat messages restricted to course members
- Profile updates restricted to own profile

### Data Privacy
- Email addresses not exposed in chat
- Student IDs only visible to instructors
- Messages logged for audit purposes

## Troubleshooting

### Common Issues

**Student cannot see instructor messages**
- Check enrollment status
- Verify group chat membership
- Check RLS policies

**Instructor not appearing as available**
- Verify Google OAuth login
- Check profile creation trigger
- Verify last seen timestamp update

**OCR not matching courses**
- Verify course codes in database
- Check OCR extraction quality
- Validate code format (e.g., CS101 vs CS-101)

**Messages not delivering**
- Check network connection
- Verify Supabase realtime subscription
- Check message queue status
