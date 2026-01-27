# API Documentation: Attendance Tracking Endpoints

**Version:** 1.0  
**Date:** January 27, 2026  
**Base URL:** `http://localhost:3001/api`

---

## Overview

These endpoints enable QR-based attendance tracking for hosted events. Hosts can scan attendee QR codes to mark physical presence at events that have attendance tracking enabled.

---

## Endpoints

### 1. Scan Attendance

**POST** `/events/:eventId/scan-attendance`

Scan a user's personal QR code to mark their attendance at an event.

#### Request

**URL Parameters:**
- `eventId` (string, required): The UUID of the event

**Body Parameters:**
```json
{
  "scanned_user_id": "uuid",
  "host_user_id": "uuid"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scanned_user_id | string (UUID) | Yes | ID of the user being scanned |
| host_user_id | string (UUID) | Yes | ID of the host performing the scan |

#### Response

**Success (201 Created)** - New attendance record:
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "scanned_by_host": true,
    "scanned_at": "2026-01-27T06:30:00.000Z",
    "scanned_by_user_id": "uuid",
    "emoji_rating": null,
    "attended_at": "2026-01-27T06:30:00.000Z"
  }
}
```

**Success (200 OK)** - Updated existing attendance:
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "attendance": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "scanned_by_host": true,
    "scanned_at": "2026-01-27T06:30:00.000Z",
    "scanned_by_user_id": "uuid",
    "emoji_rating": "🎉",
    "attended_at": "2026-01-27T05:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": "Scanned user ID is required"
}
```

- **400 Bad Request** - Event doesn't require attendance:
```json
{
  "success": false,
  "error": "This event does not require attendance tracking"
}
```

- **400 Bad Request** - User not confirmed:
```json
{
  "success": false,
  "error": "User is not confirmed for this event"
}
```

- **403 Forbidden** - Not the event host:
```json
{
  "success": false,
  "error": "Only the event host can scan attendance"
}
```

- **404 Not Found** - Event doesn't exist:
```json
{
  "success": false,
  "error": "Event not found"
}
```

#### Validation Rules

1. ✅ `host_user_id` must match `event.user_id`
2. ✅ Event must have `requires_attendance_check = true`
3. ✅ `scanned_user_id` must be confirmed (saved_event OR approved registration)
4. ✅ Creates new record if no attendance exists
5. ✅ Updates existing record if already attended

#### Example Usage

```javascript
// Frontend (React Native)
import { scanAttendance } from './services/api';

const handleScan = async (eventId, scannedUserId, hostUserId) => {
  try {
    const result = await scanAttendance(eventId, scannedUserId);
    Alert.alert('Success', 'Attendance recorded!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

```bash
# cURL Example
curl -X POST http://localhost:3001/api/events/EVENT_ID/scan-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "scanned_user_id": "USER_UUID",
    "host_user_id": "HOST_UUID"
  }'
```

---

### 2. Get Attendance List

**GET** `/events/:eventId/attendance-list`

Get the complete attendance list for an event with confirmation and attendance status for each user.

#### Request

**URL Parameters:**
- `eventId` (string, required): The UUID of the event

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "attendees": [
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_avatar": "https://...",
      "confirmed": true,
      "attended": true,
      "scanned_by_host": true,
      "scanned_at": "2026-01-27T06:30:00.000Z",
      "registration_status": "approved"
    },
    {
      "user_id": "uuid",
      "user_name": "Jane Smith",
      "user_email": "jane@example.com",
      "user_avatar": null,
      "confirmed": true,
      "attended": false,
      "scanned_by_host": false,
      "scanned_at": null,
      "registration_status": null
    }
  ]
}
```

**Empty List (200 OK)**:
```json
{
  "success": true,
  "attendees": []
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | UUID of the user |
| user_name | string\|null | Full name from profile |
| user_email | string\|null | Email from profile |
| user_avatar | string\|null | Avatar URL from profile |
| confirmed | boolean | True if saved event or approved registration |
| attended | boolean | True if attendance record exists |
| scanned_by_host | boolean | True if scanned by host |
| scanned_at | string\|null | ISO timestamp of scan |
| registration_status | string\|null | 'pending', 'approved', 'rejected', or null |

#### Example Usage

```javascript
// Frontend
import { getAttendanceList } from './services/api';

const loadAttendees = async (eventId) => {
  const data = await getAttendanceList(eventId);
  setAttendees(data.attendees);
  
  // Filter by status
  const confirmed = data.attendees.filter(a => a.confirmed);
  const attended = data.attendees.filter(a => a.attended);
  const pending = data.attendees.filter(a => !a.attended && a.confirmed);
};
```

```bash
# cURL Example
curl http://localhost:3001/api/events/EVENT_ID/attendance-list
```

---

### 3. Update Attendance Requirement

**PATCH** `/events/:eventId/attendance-requirement`

Enable or disable attendance tracking requirement for an event (host only).

#### Request

**URL Parameters:**
- `eventId` (string, required): The UUID of the event

**Body Parameters:**
```json
{
  "requires_attendance_check": true,
  "user_id": "uuid"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requires_attendance_check | boolean | Yes | Enable/disable attendance tracking |
| user_id | string (UUID) | Yes | ID of the host user |

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "My Event",
    "requires_attendance_check": true,
    "user_id": "uuid",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid boolean:
```json
{
  "success": false,
  "error": "requires_attendance_check must be a boolean"
}
```

- **403 Forbidden** - Not the host:
```json
{
  "success": false,
  "error": "Only the event host can update attendance requirements"
}
```

- **404 Not Found**:
```json
{
  "success": false,
  "error": "Event not found"
}
```

#### Example Usage

```javascript
// Frontend
import { updateAttendanceRequirement } from './services/api';

const toggleAttendance = async (eventId, enabled, userId) => {
  await updateAttendanceRequirement(eventId, enabled);
  Alert.alert('Success', `Attendance tracking ${enabled ? 'enabled' : 'disabled'}`);
};
```

```bash
# cURL Example
curl -X PATCH http://localhost:3001/api/events/EVENT_ID/attendance-requirement \
  -H "Content-Type: application/json" \
  -d '{
    "requires_attendance_check": true,
    "user_id": "HOST_UUID"
  }'
```

---

## Integration Flow

### Complete Attendance Tracking Flow

```
1. HOST CREATES EVENT
   POST /api/events
   { "requires_attendance_check": true, ... }
   
2. USER REGISTERS/SAVES EVENT
   POST /api/events/:eventId/register
   OR auto-saved for free events
   
3. HOST APPROVES REGISTRATION (if paid)
   PATCH /api/events/registrations/:regId/approve
   
4. USER ARRIVES AT EVENT
   User shows QR code from Profile > ESCANEAR
   
5. HOST SCANS QR CODE
   POST /api/events/:eventId/scan-attendance
   { "scanned_user_id": "..." }
   
6. HOST VIEWS ATTENDANCE LIST
   GET /api/events/:eventId/attendance-list
```

---

## Security Considerations

### Current Implementation (MVP)
- ⚠️ `host_user_id` is sent in request body
- Validates host ownership via database lookup

### Production Recommendations
1. **Add Authentication Middleware**: Extract user_id from JWT token
2. **Rate Limiting**: Prevent spam scans
3. **Audit Logging**: Track all scan operations
4. **WebSocket Updates**: Real-time attendance updates for hosts

---

## Database Schema Reference

### attended_events Table

```sql
CREATE TABLE attended_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES events(id),
  emoji_rating TEXT,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  scanned_by_host BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ,
  scanned_by_user_id UUID REFERENCES auth.users(id)
);
```

### events Table (New Field)

```sql
ALTER TABLE events 
ADD COLUMN requires_attendance_check BOOLEAN DEFAULT false;
```

---

## Error Codes Summary

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success - Resource updated |
| 201 | Success - Resource created |
| 400 | Bad Request - Invalid parameters |
| 403 | Forbidden - Not authorized |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database not configured |

---

## Testing

### Test Scenarios

1. **✅ Scan Confirmed User**
   - Create event with attendance check
   - User saves event
   - Host scans user → Success

2. **❌ Scan Unconfirmed User**
   - User not saved/approved
   - Host scans user → Error 400

3. **❌ Non-Host Scans**
   - Different user attempts scan → Error 403

4. **✅ Scan Same User Twice**
   - First scan → 201 Created
   - Second scan → 200 OK (updates existing)

5. **❌ Scan Without Attendance Requirement**
   - Event has `requires_attendance_check = false`
   - Scan attempt → Error 400

---

## Changelog

### v1.0 (2026-01-27)
- Initial implementation
- Added scan-attendance endpoint
- Added attendance-list endpoint
- Added attendance-requirement endpoint
- Integrated with existing event creation

---

## Support

For questions or issues:
- Check `/docs/PLAN_ATTENDANCE_TRACKING.md` for architecture
- See `/database/migrations/add_attendance_tracking.sql` for schema
- Review `/frontend/src/services/api.ts` for client integration
