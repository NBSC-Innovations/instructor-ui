# Instructor Availability Status System

## Overview
This document describes the instructor availability status feature that informs students about whether their instructor is currently active in the system, offline, or has not yet created an account.

## Status Types

### 1. Online (Active)
**Display**: Green dot indicator next to instructor name

**Conditions**:
- Instructor is logged in via Google OAuth
- Last activity within last 5 minutes
- Session is active

**Student View**:
```
Kristine L. Lopez ● Online
Institute for Computer Studies (ICS)
```

**Technical Implementation**:
```javascript
// Update last_seen timestamp on activity
const updateLastSeen = async (userId) => {
  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId);
};

// Check online status
const isOnline = (lastSeen) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastSeen) > fiveMinutesAgo;
};
```

### 2. Offline (Inactive)
**Display**: Gray dot with "Last seen" timestamp

**Conditions**:
- Instructor has an account but is not currently logged in
- Last activity was more than 5 minutes ago

**Student View**:
```
Kristine L. Lopez ○ Last seen 2 hours ago
Institute for Computer Studies (ICS)
```

**Technical Implementation**:
```javascript
const formatLastSeen = (lastSeen) => {
  const now = new Date();
  const seen = new Date(lastSeen);
  const diff = now - seen;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return seen.toLocaleDateString();
};
```

### 3. Account Not Created
**Display**: Warning icon with "Account not created" message

**Conditions**:
- No profile exists for the instructor
- Course has instructor_id but no matching profile

**Student View**:
```
⚠️ Instructor account not yet created
Contact Institute for Computer Studies (ICS) for assistance
```

**Technical Implementation**:
```javascript
const checkInstructorExists = async (instructorId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, department')
    .eq('id', instructorId)
    .single();
  
  if (error || !data) {
    return { exists: false, message: 'Account not created' };
  }
  return { exists: true, instructor: data };
};
```

### 4. On Leave
**Display**: Calendar icon with leave dates

**Conditions**:
- Instructor has set leave status in profile
- Current date falls within leave period

**Student View**:
```
📅 Instructor on leave
Aug 1 - Aug 15, 2024
Contact substitute: [Name] or department office
```

**Database Schema Addition**:
```sql
ALTER TABLE public.profiles 
ADD COLUMN on_leave BOOLEAN DEFAULT false,
ADD COLUMN leave_start_date DATE,
ADD COLUMN leave_end_date DATE,
ADD COLUMN substitute_instructor_id UUID REFERENCES public.profiles(id);
```

## Database Schema

### Profiles Table (Additions)
```sql
ALTER TABLE public.profiles
ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN on_leave BOOLEAN DEFAULT false,
ADD COLUMN leave_start_date DATE,
ADD COLUMN leave_end_date DATE,
ADD COLUMN substitute_instructor_id UUID REFERENCES public.profiles(id);
```

### Triggers
```sql
-- Update last_seen on profile update
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  NEW.is_online = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_last_seen
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

-- Set is_online to false after 5 minutes of inactivity
-- This would be run by a scheduled job
```

## Frontend Implementation

### React Component
```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

function InstructorStatus({ instructorId }) {
  const [status, setStatus] = useState('loading');
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    fetchInstructorStatus();
    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`instructor-${instructorId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${instructorId}`
      }, (payload) => {
        setInstructor(payload.new);
        updateStatus(payload.new);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [instructorId]);

  const fetchInstructorStatus = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', instructorId)
      .single();

    if (error) {
      setStatus('not_created');
    } else {
      setInstructor(data);
      updateStatus(data);
    }
  };

  const updateStatus = (data) => {
    if (data.on_leave && isWithinLeavePeriod(data)) {
      setStatus('on_leave');
    } else if (isOnline(data.last_seen)) {
      setStatus('online');
    } else {
      setStatus('offline');
    }
  };

  const isOnline = (lastSeen) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const isWithinLeavePeriod = (data) => {
    if (!data.leave_start_date || !data.leave_end_date) return false;
    const now = new Date();
    const start = new Date(data.leave_start_date);
    const end = new Date(data.leave_end_date);
    return now >= start && now <= end;
  };

  const renderStatus = () => {
    switch (status) {
      case 'online':
        return (
          <div className="instructor-status online">
            <span className="status-dot online"></span>
            <span>Online</span>
          </div>
        );
      case 'offline':
        return (
          <div className="instructor-status offline">
            <span className="status-dot offline"></span>
            <span>Last seen {formatLastSeen(instructor?.last_seen)}</span>
          </div>
        );
      case 'on_leave':
        return (
          <div className="instructor-status on-leave">
            <span className="status-icon">📅</span>
            <span>On leave until {instructor?.leave_end_date}</span>
          </div>
        );
      case 'not_created':
        return (
          <div className="instructor-status not-created">
            <span className="status-icon">⚠️</span>
            <span>Account not created</span>
          </div>
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="instructor-status-container">
      {renderStatus()}
      {instructor?.department && (
        <p className="department">{instructor.department}</p>
      )}
    </div>
  );
}
```

## API Endpoints

### Get Instructor Status
```javascript
GET /api/instructors/:id/status

Response:
{
  "status": "online" | "offline" | "on_leave" | "not_created",
  "instructor": {
    "id": "uuid",
    "full_name": "string",
    "department": "string",
    "last_seen": "timestamp",
    "on_leave": boolean,
    "leave_start_date": "date",
    "leave_end_date": "date"
  }
}
```

### Update Instructor Status (Instructor Only)
```javascript
PATCH /api/instructors/me/status

Body:
{
  "on_leave": boolean,
  "leave_start_date": "date",
  "leave_end_date": "date",
  "substitute_instructor_id": "uuid"
}
```

## Real-time Updates

### Supabase Realtime Subscription
```javascript
// Subscribe to instructor status changes
const subscription = supabase
  .channel('instructor-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${instructorId}`
  }, (payload) => {
    // Update UI with new status
    updateInstructorStatus(payload.new);
  })
  .subscribe();
```

## Scheduled Jobs

### Update Online Status
Run every minute to mark inactive instructors as offline:

```sql
-- Mark instructors as offline if last_seen > 5 minutes ago
UPDATE public.profiles
SET is_online = false
WHERE last_seen < NOW() - INTERVAL '5 minutes'
AND is_online = true;
```

## User Interface Guidelines

### Dashboard Display
- Show instructor status in course cards
- Use color coding: green (online), gray (offline), yellow (on leave), red (not created)
- Display last seen time for offline instructors
- Show department contact info for unavailable instructors

### Chat Interface
- Show instructor status in chat header
- Disable typing indicator if instructor is offline
- Queue messages for offline instructors
- Show "Message will be delivered when instructor returns" notification

### Mobile Optimization
- Simplified status indicator (dot only)
- Tap to see full status details
- Quick action to contact department if instructor unavailable

## Error Handling

### Network Issues
- Cache last known status locally
- Show "Checking status..." while fetching
- Retry failed requests with exponential backoff

### Missing Data
- Gracefully handle missing last_seen timestamps
- Default to "Unknown status" if data is incomplete
- Log errors for debugging

## Security Considerations

### Privacy
- Only show last seen to enrolled students
- Don't expose exact timestamps to non-enrolled users
- Allow instructors to hide online status if desired

### Rate Limiting
- Limit status check API calls to prevent abuse
- Cache status for 1 minute to reduce database load

## Testing

### Test Cases
1. Instructor logs in → status changes to online
2. Instructor inactive for 5 minutes → status changes to offline
3. Instructor sets leave status → shows on leave message
4. Instructor account deleted → shows not created message
5. Multiple students viewing same instructor → consistent status display

### Manual Testing
```javascript
// Test status transitions
await setInstructorOnline(instructorId);
await waitFor(6 * 60 * 1000); // Wait 6 minutes
await checkStatus(instructorId); // Should be offline

await setInstructorOnLeave(instructorId, '2024-08-01', '2024-08-15');
await checkStatus(instructorId); // Should be on_leave
```
