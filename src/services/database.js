import { supabase } from '../utils/supabaseClient'

// Create a new profile using service role (bypasses RLS)
export async function createProfileWithServiceRole(userId, email, fullName, role) {
  try {
    // Use the service role key from environment
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SECRET_KEY
    
    if (!serviceRoleKey) {
      throw new Error('Service role key not available')
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
        student_id: role === 'student' ? email.split('@')[0] : null
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create profile: ${error}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating profile with service role:', error)
    throw error
  }
}

// Create a new profile
export async function createProfile(userId, email, fullName, role) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
        student_id: role === 'student' ? email.split('@')[0] : null
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating profile:', error)
    return null
  }
}

// Fetch instructor profile by email (from profiles table)
// Special exception: 20221224@nbsc.edu.ph bypasses role check for development
export async function fetchInstructorProfile(email) {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('email', email)

    // For development, don't filter by role to allow any profile
    // Remove role filter temporarily for debugging
    // if (email !== '20221224@nbsc.edu.ph') {
    //   query = query.eq('role', 'instructor')
    // }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    console.log('[fetchInstructorProfile] Found profile:', data)
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
    // Use the SECURITY DEFINER function to bypass RLS
    const { data, error } = await supabase.rpc('fetch_course_messages', {
      p_course_id: courseId
    })

    if (error) throw error

    // Manually fetch profiles for each message
    const messagesWithProfiles = await Promise.all(
      data.map(async (message) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, student_id, role')
          .eq('id', message.sender_id)
          .single()
        
        return {
          ...message,
          profiles: profileData || { full_name: 'Unknown', student_id: null, role: 'student' }
        }
      })
    )

    return messagesWithProfiles
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

// Send a new message to a course using the SECURITY DEFINER function
export async function sendMessage(courseId, senderId, content) {
  try {
    console.log('[sendMessage] Attempting to send message:', {
      courseId,
      senderId,
      content
    })

    // Use the SECURITY DEFINER function to bypass RLS
    const { data, error } = await supabase.rpc('insert_message', {
      p_course_id: courseId,
      p_sender_id: senderId,
      p_content: content
    })

    if (error) {
      console.error('[sendMessage] Database error:', error)
      throw error
    }

    console.log('[sendMessage] Message inserted successfully:', data)

    // Fetch profile data separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, student_id, role')
      .eq('id', senderId)
      .single()

    return {
      ...data[0],
      profiles: profileData || { full_name: 'Unknown', student_id: null, role: 'student' }
    }
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
// Note: The database trigger will automatically create the course and group chat
export async function createSection(sectionData) {
  try {
    // Create the section - trigger will handle course and group chat creation
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

    // The trigger has already created the course and group chat
    // Return the section with the course_id populated by the trigger
    return section
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

// ============================================
// STUDENT-FACING FUNCTIONS
// ============================================

// Find section by code (for manual student enrollment)
export async function findSectionByCode(sectionCode) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select(`
        *,
        courses:course_id (
          id,
          code,
          title,
          instructor_id
        )
      `)
      .eq('name', sectionCode)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error finding section by code:', error)
    return null
  }
}

// Enroll student in a section/course
export async function enrollInSection(sectionId, courseId, studentId) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error enrolling in section:', error)
    return null
  }
}

// Get student's enrollments
export async function getStudentEnrollments(studentId) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses:course_id (
          id,
          code,
          title,
          description,
          instructor_id,
          schedule
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false })

    if (error) throw error
    
    // Fetch sections separately for each enrollment
    const enrollmentsWithSections = await Promise.all(
      data.map(async (enrollment) => {
        const { data: sectionData } = await supabase
          .from('sections')
          .select('*')
          .eq('course_id', enrollment.course_id)
          .single()
        
        return {
          ...enrollment,
          section: sectionData
        }
      })
    )
    
    return enrollmentsWithSections
  } catch (error) {
    console.error('Error getting student enrollments:', error)
    return []
  }
}

// Get members of a course's group chat
export async function getCourseMembers(courseId) {
  try {
    // First get the group chat ID for the course
    const { data: groupChat, error: chatError } = await supabase
      .from('group_chats')
      .select('id')
      .eq('course_id', courseId)
      .single()

    if (chatError) throw chatError
    if (!groupChat) return []

    // Then get the members of that group chat
    const { data, error } = await supabase
      .from('group_chat_members')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          student_id,
          role
        )
      `)
      .eq('group_chat_id', groupChat.id)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting course members:', error)
    return []
  }
}

// Get student's group chats
export async function getStudentGroupChats(studentId) {
  try {
    const { data, error } = await supabase
      .from('group_chat_members')
      .select(`
        *,
        group_chats:group_chat_id (
          id,
          name,
          course_id,
          courses:course_id (
            code,
            title,
            instructor_id
          )
        )
      `)
      .eq('user_id', studentId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting student group chats:', error)
    return []
  }
}
