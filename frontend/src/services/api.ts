import axios from 'axios';

// Configure base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Event {
    id: string;
    title: string;
    description: string | null;
    category: string;
    image: string | null;
    image_url?: string | null;
    date: string | null;
    time: string | null;
    end_time?: string | null;
    location: string | null;
    organizer?: string | null;
    user_id?: string | null;
    created_at: string;
    // Nuevos campos para eventos de pago y registro
    price?: number | null;
    registration_form_url?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    // Attendance tracking
    requires_attendance_check?: boolean | null;
    // Recurring events
    is_recurring?: boolean | null;
    recurring_dates?: string[] | null;
    // Target audience
    target_audience?: string[] | null;
    // Subcategory & tags
    subcategory?: string | null;
    tags?: string[] | null;
    event_features?: Record<string, string> | null;
    // Reservations
    reservation_contact?: string | null;
}

export interface CreateEventData {
    title: string;
    description?: string;
    category?: string;
    image?: string | null;
    date?: string | null;
    time?: string | null;
    end_time?: string | null;
    location?: string | null;
    organizer?: string | null;
    user_id?: string | null;
    // Nuevos campos para eventos de pago y registro
    price?: number | null;
    registration_form_url?: string | null;
    reservation_contact?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    // Attendance tracking
    requires_attendance_check?: boolean | null;
    // Recurring events
    is_recurring?: boolean | null;
    recurring_dates?: string[] | null;
    // Target audience
    target_audience?: string[] | null;
    // Subcategory & tags
    subcategory?: string | null;
    tags?: string[] | null;
    event_features?: Record<string, string> | null;
}

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    payment_receipt_url?: string | null;
    registration_form_completed: boolean;
    rejection_reason?: string | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
}

export interface HostedEvent extends Event {
    attendee_count: number;
}

export interface Attendee {
    id: string;
    saved_at: string;
    profiles: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
    // Attendance tracking
    scanned_by_host?: boolean;
    scanned_at?: string | null;
    attended?: boolean;
}

export interface AttendanceListItem {
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    user_avatar: string | null;
    confirmed: boolean;
    attended: boolean;
    scanned_by_host: boolean;
    scanned_at: string | null;
    registration_status: string | null;
    payment_receipt_url?: string | null;
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventData): Promise<Event> {
    const response = await api.post('/events', data);
    return response.data.event;
}

/**
 * Fetch all events with optional category filter
 */
export async function fetchEvents(category?: string): Promise<Event[]> {
    const params = category && category !== 'all' ? { category } : {};
    const response = await api.get('/events', { params });
    return response.data.events;
}

/**
 * Fetch single event by ID
 */
export async function fetchEventById(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data.event;
}

export interface AnalysisResult {
    analysis: {
        event_name: string;
        date: string;
        time: string;
        end_time?: string;
        description: string;
        location: string;
        organizer?: string;
        price?: string;
        registration_url?: string;
        is_recurring?: boolean;
        recurring_pattern?: string | null;
        recurring_dates?: string[];
        category?: 'music' | 'volunteer' | 'general';
        subcategory?: string | null;
        tags?: string[];
        event_features?: {
            mood?: string;
            vibe?: string;
            timeOfDay?: string;
            socialSetting?: string;
        } | null;
        confidence: string;
        extracted_text: string;
    };
    success: boolean;
}

/**
 * Analyze an event flyer image
 */
export async function analyzeImage(base64Image: string, title?: string): Promise<AnalysisResult> {
    const response = await api.post('/events/analyze-image', {
        image: base64Image,
        title: title || 'New Event Upload'
    });
    return response.data;
}

// New response format: extraction only (no analysis)
export interface UrlExtractionResult {
    success: boolean;
    source_url: string;
    platform: 'instagram';
    extracted_images: string[];  // All images from carousel/post
    is_reel?: boolean;
    post_metadata?: {
        author?: string;
        description?: string;
    };
    error?: string;
}

// On-demand image analysis result
export interface ImageAnalysisResult {
    success: boolean;
    analysis: {
        event_name: string;
        date: string;
        time: string;
        end_time?: string;
        description: string;
        location: string;
        organizer?: string;
        price?: string;
        registration_url?: string;
        is_recurring?: boolean;
        recurring_pattern?: string | null;
        recurring_dates?: string[];
        category?: 'music' | 'volunteer' | 'general';
        subcategory?: string | null;
        tags?: string[];
        event_features?: {
            mood?: string;
            vibe?: string;
            timeOfDay?: string;
            socialSetting?: string;
        } | null;
        confidence: string;
        extracted_text: string;
    };
    metadata?: {
        model: string;
        tokens_used: number;
    };
    error?: string;
}

// Legacy type for backwards compatibility
export interface UrlAnalysisResult extends AnalysisResult {
    source_url: string;
    platform: 'instagram';
    extracted_image_url: string;
    extracted_images?: string[];
    is_reel?: boolean;
    post_metadata?: {
        author?: string;
        description?: string;
    };
}

/**
 * Extract images from an Instagram post URL (no analysis)
 * Step 1 of the two-step flow
 */
export async function extractUrl(url: string): Promise<UrlExtractionResult> {
    const response = await api.post('/events/analyze-url', { url }, { timeout: 180000 });
    return response.data;
}

/**
 * Analyze a single extracted image with Vision API
 * Step 2 of the two-step flow (on-demand)
 */
export async function analyzeExtractedImage(imageUrl: string, title?: string): Promise<ImageAnalysisResult> {
    const response = await api.post('/events/analyze-extracted-image', {
        image_url: imageUrl,
        title
    }, { timeout: 60000 });
    return response.data;
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use extractUrl + analyzeExtractedImage instead
 */
export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
    const response = await api.post('/events/analyze-url', { url }, { timeout: 180000 });
    return response.data;
}

/**
 * Fetch events hosted by a specific user
 */
export async function fetchHostedEvents(userId: string): Promise<HostedEvent[]> {
    const response = await api.get(`/events/hosted/${userId}`);
    return response.data.events;
}

/**
 * Fetch attendees for a specific event
 */
export async function fetchEventAttendees(eventId: string): Promise<Attendee[]> {
    const response = await api.get(`/events/${eventId}/attendees`);
    return response.data.attendees;
}

/**
 * Register for an event (creates a pending registration request)
 */
export async function registerForEvent(
    eventId: string,
    userId: string,
    paymentReceiptUrl?: string,
    registrationFormCompleted?: boolean
): Promise<EventRegistration> {
    const response = await api.post(`/events/${eventId}/register`, {
        user_id: userId,
        payment_receipt_url: paymentReceiptUrl,
        registration_form_completed: registrationFormCompleted
    });
    return response.data.registration;
}

/**
 * Fetch all registrations for a specific event (host only)
 */
export async function fetchEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const response = await api.get(`/events/${eventId}/registrations`);
    return response.data.registrations;
}

/**
 * Approve a registration request
 */
export async function approveRegistration(registrationId: string): Promise<EventRegistration> {
    const response = await api.patch(`/events/registrations/${registrationId}/approve`);
    return response.data.registration;
}

/**
 * Reject a registration request with optional reason
 */
export async function rejectRegistration(
    registrationId: string,
    rejectionReason?: string
): Promise<EventRegistration> {
    const response = await api.patch(`/events/registrations/${registrationId}/reject`, {
        rejection_reason: rejectionReason
    });
    return response.data.registration;
}

/**
 * Fetch all registrations for a specific user
 */
export async function fetchUserRegistrations(userId: string): Promise<EventRegistration[]> {
    const response = await api.get(`/events/registrations/user/${userId}`);
    return response.data.registrations;
}

/**
 * Scan a user's QR code to mark attendance at an event
 */
export async function scanAttendance(
    eventId: string,
    scannedUserId: string,
    hostUserId: string
): Promise<void> {
    const response = await api.post(`/events/${eventId}/scan-attendance`, {
        scanned_user_id: scannedUserId,
        host_user_id: hostUserId
    });
    return response.data;
}

/**
 * Get attendance list for an event (host only)
 */
export async function getAttendanceList(eventId: string): Promise<AttendanceListItem[]> {
    const response = await api.get(`/events/${eventId}/attendance-list`);
    return response.data.attendees;
}

/**
 * Update attendance requirement for an event (host only)
 */
export async function updateAttendanceRequirement(
    eventId: string,
    requiresAttendance: boolean
): Promise<void> {
    const response = await api.patch(`/events/${eventId}/attendance-requirement`, {
        requires_attendance_check: requiresAttendance
    });
    return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE STORAGE  (Supabase Storage — permanent URLs that never expire)
// ─────────────────────────────────────────────────────────────────────────────

export interface StorageUploadResult {
  success: boolean;
  publicUrl: string;
}

/**
 * Upload an image from an external URL to Supabase Storage.
 * If event_id is provided, the event's image field is also updated in the DB.
 * Returns the permanent Supabase public URL.
 */
export async function uploadImageFromUrl(
  url: string,
  eventId?: string,
  filename?: string
): Promise<StorageUploadResult> {
  const response = await api.post(
    '/storage/upload-image-url',
    { url, event_id: eventId, filename },
    { timeout: 30000 }
  );
  return response.data;
}

/**
 * Upload a base64-encoded image (data URI or raw) to Supabase Storage.
 * If event_id is provided, the event's image field is also updated in the DB.
 * Returns the permanent Supabase public URL.
 */
export async function uploadImageBase64(
  base64: string,
  eventId?: string,
  filename?: string
): Promise<StorageUploadResult> {
  const response = await api.post(
    '/storage/upload-image-base64',
    { base64, event_id: eventId, filename },
    { timeout: 30000 }
  );
  return response.data;
}

/**
 * Migrate all existing events that still have external (expiring) image URLs
 * to permanent Supabase Storage URLs.
 * Returns a summary with migrated / failed counts.
 */
export async function migrateEventImages(limit = 50): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  total: number;
  results: { id: string; title: string; status: string; publicUrl?: string; error?: string }[];
}> {
  const response = await api.post(
    '/storage/migrate-event-images',
    { limit },
    { timeout: 120000 }
  );
  return response.data;
}

/**
 * Trigger extraction processing (fire-and-forget)
 * Backend will update Supabase directly
 */
export const triggerExtraction = (jobId: string): void => {
    api.post(`/extraction-jobs/process/${jobId}`).catch((error) => {
        console.error('[API] Failed to trigger extraction:', error.message);
    });
};

/**
 * Trigger analysis for selected image (fire-and-forget)
 * Backend will update Supabase directly
 */
export const triggerAnalysis = (jobId: string, imageUrl: string): void => {
    api.post(`/extraction-jobs/analyze/${jobId}`, { image_url: imageUrl }).catch((error) => {
        console.error('[API] Failed to trigger analysis:', error.message);
    });
};

export interface FlyerSubmitResult {
    success: boolean;
    id?: string;
    error?: string;
}

/**
 * Submit an event flyer (base64 image) to the whatsapp_flyers pipeline
 * for automated processing and potential publication in WoW.
 * Works without authentication — handled server-side with service role.
 */
export async function submitEventFlyer(
    base64: string,
    senderName?: string,
    description?: string
): Promise<FlyerSubmitResult> {
    const response = await api.post(
        '/whatsapp/submit',
        { base64, sender_name: senderName, event_description: description },
        { timeout: 30000 }
    );
    return response.data;
}

export default api;
