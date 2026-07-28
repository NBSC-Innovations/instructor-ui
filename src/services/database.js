import { supabase } from '../utils/supabaseClient'

// Fetch instructor profile by email (from profiles table)
// Special exception: 20221224@nbsc.edu.ph bypasses role check for development
export async function fetchInstructorProfile(email) {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('email', email)

    // Bypass role check for the allowed exception email
    if (email !== '20221224@nbsc.edu.ph') {
      query = query.eq('role', 'instructor')
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching instructor profile:', error)
    return null
  }
}

// Fetch all courses for an instructor
export async function fetchInstructorCourses(instructorId) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching instructor courses:', error)
    return []
  }
}

// Fetch sections for a specific course
export async function fetchCourseSections(courseId) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching course sections:', error)
    return []
  }
}

// Fetch messages for a specific course (from gc_messages table)
export async function fetchCourseMessages(courseId) {
  try {
    const { data, error } = await supabase
      .from('gc_messages')
      .select(`
        *,
        profiles:sender_id (
          full_name,
          student_id,
          role
        )
      `)
      .eq('course_id', courseId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching course messages:', error)
    return []
  }
}

// Mark a message as pinned/unpinned
export async function toggleMessagePin(messageId, isPinned) {
  try {
    const { data, error } = await supabase
      .from('gc_messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error toggling message pin:', error)
    return null
  }
}

// Send a new message to a course
export async function sendMessage(courseId, senderId, content) {
  try {
    const { data, error } = await supabase
      .from('gc_messages')
      .insert({
        course_id: courseId,
        sender_id: senderId,
        content: content,
        is_deleted: false
      })
      .select(`
        *,
        profiles:sender_id (
          full_name,
          student_id,
          role
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error sending message:', error)
    return null
  }
}

// Update instructor profile
export async function updateInstructorProfile(profileId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating instructor profile:', error)
    return null
  }
}

// Fetch enrolled students count for a course
export async function fetchCourseEnrollmentCount(courseId) {
  try {
    const { count, error } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active')

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error fetching enrollment count:', error)
    return 0
  }
}

// Fetch enrolled students for a course
export async function fetchCourseEnrollments(courseId) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          email,
          student_id,
          role
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching course enrollments:', error)
    return []
  }
}

// Fetch complete course data with messages for instructor
export async function fetchCoursesWithMessages(instructorId) {
  try {
    const courses = await fetchInstructorCourses(instructorId)

    const coursesWithMessages = await Promise.all(
      courses.map(async (course) => {
        const sections = await fetchCourseSections(course.id)
        const messages = await fetchCourseMessages(course.id)
        const enrolledCount = await fetchCourseEnrollmentCount(course.id)
        const enrollments = await fetchCourseEnrollments(course.id)

        return {
          id: course.id,
          code: course.code,
          name: course.title,
          section: sections.length > 0 ? sections[0].name : 'No sections',
          enrolledCount: enrolledCount,
          enrollments: enrollments.map(enrollment => ({
            id: enrollment.id,
            studentId: enrollment.profiles?.id,
            fullName: enrollment.profiles?.full_name || 'Unknown',
            email: enrollment.profiles?.email,
            studentNumber: enrollment.profiles?.student_id,
            role: enrollment.profiles?.role,
            enrolledAt: enrollment.enrolled_at,
            status: enrollment.status
          })),
          messages: messages.map(msg => ({
            id: msg.id,
            senderName: msg.profiles?.full_name || 'Unknown',
            senderRole: msg.profiles?.role || 'student',
            content: msg.content,
            createdAt: msg.created_at,
            pinned: msg.is_pinned || false
          }))
        }
      })
    )

    return coursesWithMessages
  } catch (error) {
    console.error('Error fetching courses with messages:', error)
    return []
  }
}

// Create a new section with group chat
export async function createSection(sectionData) {
  try {
    // First create the section
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        name: sectionData.sectionCode,
        description: sectionData.subjectDescription,
        instructor_id: sectionData.instructorId,
        schedule: sectionData.schedule || null,
        room: sectionData.room || null,
        max_capacity: sectionData.maxCapacity || 40,
        current_enrollment: 0
      })
      .select()
      .single()

    if (sectionError) throw sectionError

    // Create a course for this section (for group chat compatibility)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        code: sectionData.sectionCode,
        title: sectionData.subjectDescription,
        instructor_id: sectionData.instructorId,
        is_active: true
      })
      .select()
      .single()

    if (courseError) throw courseError

    // Link the section to the course
    await supabase
      .from('sections')
      .update({ course_id: course.id })
      .eq('id', section.id)

    return { ...section, course_id: course.id }
  } catch (error) {
    console.error('Error creating section:', error)
    return null
  }
}

// Update an existing section
export async function updateSection(sectionId, updates) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating section:', error.message || error)
    return null
  }
}

// Delete a section
export async function deleteSection(sectionId) {
  try {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting section:', error)
    return false
  }
}

// Fetch all sections for an instructor (across all their courses)
export async function fetchInstructorSections(instructorId) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select(`
        *,
        courses:course_id (
          id,
          code,
          title
        )
      `)
      .eq('instructor_id', instructorId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching instructor sections:', error)
    return []
  }
}

// Fetch sections with messages for group chat display
export async function fetchSectionsWithMessages(instructorId) {
  try {
    const sections = await fetchInstructorSections(instructorId)

    const sectionsWithMessages = await Promise.all(
      sections.map(async (section) => {
        const messages = await fetchCourseMessages(section.course_id)
        const enrolledCount = await fetchCourseEnrollmentCount(section.course_id)
        const enrollments = await fetchCourseEnrollments(section.course_id)

        return {
          id: section.id,
          code: section.name,
          name: section.description || 'No description',
          section: section.name,
          enrolledCount: enrolledCount,
          enrollments: enrollments.map(enrollment => ({
            id: enrollment.id,
            studentId: enrollment.profiles?.id,
            fullName: enrollment.profiles?.full_name || 'Unknown',
            email: enrollment.profiles?.email,
            studentNumber: enrollment.profiles?.student_id,
            role: enrollment.profiles?.role,
            enrolledAt: enrollment.enrolled_at,
            status: enrollment.status
          })),
          messages: messages.map(msg => ({
            id: msg.id,
            senderName: msg.profiles?.full_name || 'Unknown',
            senderRole: msg.profiles?.role || 'student',
            content: msg.content,
            createdAt: msg.created_at,
            pinned: msg.is_pinned || false
          })),
          courseId: section.course_id
        }
      })
    )

    return sectionsWithMessages
  } catch (error) {
    console.error('Error fetching sections with messages:', error)
    return []
  }
}
