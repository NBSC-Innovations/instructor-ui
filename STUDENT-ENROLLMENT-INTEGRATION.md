# Student Enrollment Integration Guide

## Overview

This document explains how the student enrollment flow integrates with the section-based group chat system. The integration uses database triggers to automatically sync students into group chats when they enroll in courses.

## Database Schema Changes

### Sections Table Update

The `sections` table was modified to allow `course_id` to be nullable initially:

```sql
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, -- No longer NOT NULL
    name TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    schedule JSONB,
    room TEXT,
    max_capacity INTEGER DEFAULT 40,
    current_enrollment INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(course_id, name)
);
```

This change allows the trigger to create the course first, then update the section with the `course_id`.

## Database Triggers

### 1. Section Creation Trigger

**Trigger Name:** `create_course_and_group_chat_on_section`

**Function:** `create_course_and_group_chat_for_section()`

**When it runs:** AFTER INSERT on `sections`

**What it does:**
1. Creates a course with the section's code and description
2. Updates the section with the new course_id
3. Creates a group chat linked to the course
4. Adds the instructor to the group chat

```sql
CREATE OR REPLACE FUNCTION public.create_course_and_group_chat_for_section()
RETURNS TRIGGER AS $$
DECLARE
    new_course_id UUID;
    new_group_chat_id UUID;
BEGIN
    -- Create a course for the section
    INSERT INTO public.courses (code, title, description, instructor_id, is_active)
    VALUES (
        NEW.name, -- Section code becomes course code
        COALESCE(NEW.description, NEW.name), -- Description becomes course title
        NEW.description,
        NEW.instructor_id,
        true
    )
    RETURNING id INTO new_course_id;
    
    -- Update the section with the new course_id
    UPDATE public.sections
    SET course_id = new_course_id
    WHERE id = NEW.id;
    
    -- Create a group chat for the course
    INSERT INTO public.group_chats (course_id, name)
    VALUES (
        new_course_id,
        NEW.name || COALESCE(' - ' || NEW.description, '')
    )
    RETURNING id INTO new_group_chat_id;
    
    -- Add the instructor to the group chat
    IF NEW.instructor_id IS NOT NULL THEN
        INSERT INTO public.group_chat_members (group_chat_id, user_id)
        VALUES (new_group_chat_id, NEW.instructor_id)
        ON CONFLICT (group_chat_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 2. Student Enrollment Trigger

**Trigger Name:** `add_student_to_chat_on_enrollment`

**Function:** `add_student_to_group_chat()`

**When it runs:** AFTER INSERT OR UPDATE on `enrollments`

**What it does:**
- When an enrollment is created or updated with status='active'
- Automatically adds the student to the course's group chat

```sql
CREATE OR REPLACE FUNCTION public.add_student_to_group_chat()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        INSERT INTO public.group_chat_members (group_chat_id, user_id)
        SELECT id, NEW.student_id FROM public.group_chats WHERE course_id = NEW.course_id
        ON CONFLICT (group_chat_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Student-Facing Functions

The following functions have been added to `src/services/database.js` to support student enrollment:

### 1. findSectionByCode(sectionCode)

Finds a section by its code for manual student enrollment.

```javascript
const section = await findSectionByCode('BSIT-3A');
// Returns: section with course information
```

### 2. enrollInSection(sectionId, courseId, studentId)

Enrolls a student in a course with active status.

```javascript
const enrollment = await enrollInSection(sectionId, courseId, studentId);
// Trigger automatically adds student to group chat
```

### 3. getStudentEnrollments(studentId)

Gets all active enrollments for a student with course and section details.

```javascript
const enrollments = await getStudentEnrollments(studentId);
// Returns: array of enrollments with course and section info
```

### 4. getCourseMembers(courseId)

Gets all members of a course's group chat.

```javascript
const members = await getCourseMembers(courseId);
// Returns: array of group chat members with profile info
```

### 5. getStudentGroupChats(studentId)

Gets all group chats a student is a member of.

```javascript
const chats = await getStudentGroupChats(studentId);
// Returns: array of group chats with course information
```

## Instructor-Side Changes

### createSection Function Update

The `createSection` function in `database.js` was simplified to rely on the database trigger:

**Before:**
```javascript
export async function createSection(sectionData) {
  // Manually create section
  // Manually create course
  // Manually link section to course
  // Manually create group chat
}
```

**After:**
```javascript
export async function createSection(sectionData) {
  // Just create the section
  // Trigger handles everything else automatically
}
```

## Complete Flow

### Instructor Creates Section

1. Instructor calls `createSection()` with section code and description
2. Section is inserted into database
3. **Trigger fires:**
   - Creates course with same code/description
   - Updates section with course_id
   - Creates group chat linked to course
   - Adds instructor to group chat
4. Instructor is now ready to receive students

### Student Enrolls (Manual Code Entry)

1. Student enters section code (e.g., "BSIT-3A")
2. Frontend calls `findSectionByCode('BSIT-3A')`
3. System displays section details for confirmation
4. Student confirms enrollment
5. Frontend calls `enrollInSection(sectionId, courseId, studentId)`
6. **Trigger fires:**
   - Enrollment is created with status='active'
   - Student is automatically added to group chat
7. Student can now communicate in the group chat

### Student Enrolls (OCR Scan)

1. Student uploads COR image
2. Backend OCR extracts name and section codes
3. Frontend displays extracted data for review
4. Student confirms enrollment
5. For each section code:
   - Frontend calls `findSectionByCode(sectionCode)`
   - Frontend calls `enrollInSection(sectionId, courseId, studentId)`
   - **Trigger fires:** Student added to group chat
6. Student can now communicate in all enrolled section chats

## API Integration Examples

### Manual Enrollment Flow

```javascript
// 1. Student enters section code
const sectionCode = 'BSIT-3A';

// 2. Find the section
const section = await findSectionByCode(sectionCode);
ifsection (!section) {
  alert('Section not found');
  return;
}

// 3. Display for confirmation
if (confirm(`Enroll in ${section.name} - ${section.description}?`)) {
  // 4. Enroll the student
  const enrollment = await enrollInSection(
    section.id,
    section.courses.id,
    studentId
  );
  
  if (enrollment) {
    alert('Successfully enrolled! You have been added to the group chat.');
  }
}
```

### OCR Enrollment Flow

```javascript
// 1. OCR extracts section codes from COR
const extractedData = {
  name: 'Juan Dela Cruz',
  sections: [
    { code: 'BSIT-3A', description: 'System Integration' },
    { code: 'IT311', description: 'Web Development' }
  ]
};

// 2. For each section, enroll the student
for (const section of extractedData.sections) {
  const sectionData = await findSectionByCode(section.code);
  if (sectionData) {
    await enrollInSection(
      sectionData.id,
      sectionData.courses.id,
      studentId
    );
  }
}
```

## Testing the Integration

### Test 1: Create Section and Verify Auto-Creation

```sql
-- Create a section
INSERT INTO public.sections (name, description, instructor_id)
VALUES ('TEST-101', 'Test Course', 'your-instructor-id');

-- Verify course was created
SELECT * FROM public.courses WHERE code = 'TEST-101';

-- Verify group chat was created
SELECT * FROM public.group_chats WHERE course_id = (
  SELECT id FROM public.courses WHERE code = 'TEST-101'
);

-- Verify instructor was added to group chat
SELECT * FROM public.group_chat_members WHERE user_id = 'your-instructor-id';
```

### Test 2: Enroll Student and Verify Chat Addition

```sql
-- Enroll a student
INSERT INTO public.enrollments (student_id, course_id, status)
VALUES ('student-id', 'course-id', 'active');

-- Verify student was added to group chat
SELECT * FROM public.group_chat_members 
WHERE user_id = 'student-id' 
AND group_chat_id = (SELECT id FROM public.group_chats WHERE course_id = 'course-id');
```

## Troubleshooting

### Section created but course not created?

1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'create_course_and_group_chat_on_section';
   ```

2. Check trigger function:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'create_course_and_group_chat_for_section';
   ```

3. Check for errors in section creation:
   ```sql
   SELECT * FROM public.sections WHERE name = 'your-section-code';
   ```

### Student enrolled but not in group chat?

1. Check enrollment status:
   ```sql
   SELECT * FROM public.enrollments WHERE student_id = 'student-id' AND status = 'active';
   ```

2. Check if group chat exists:
   ```sql
   SELECT * FROM public.group_chats WHERE course_id = 'course-id';
   ```

3. Check enrollment trigger:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'add_student_to_chat_on_enrollment';
   ```

### RLS Issues

If triggers fail due to RLS, ensure the trigger functions use `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION public.create_course_and_group_chat_for_section()
RETURNS TRIGGER AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Security Considerations

1. **Trigger Security:** All trigger functions use `SECURITY DEFINER` to bypass RLS
2. **Service Role:** Some operations may require service role key for profile creation
3. **RLS Policies:** Ensure RLS policies allow:
   - Instructors to create sections
   - Authenticated users to create enrollments
   - Service role to bypass RLS for trigger operations

## Summary

The integration is now complete:

1. **Instructor side:** Creating a section automatically creates the course and group chat
2. **Student side:** Enrolling in a course automatically adds the student to the group chat
3. **Manual sync:** No manual management of group chat memberships required
4. **OCR support:** The flow works with both manual code entry and OCR-based enrollment

All synchronization is handled by database triggers, ensuring data consistency and reducing the complexity of frontend code.
