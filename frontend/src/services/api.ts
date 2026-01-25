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
    date: string | null;
    time: string | null;
    location: string | null;
    user_id?: string | null;
    created_at: string;
    // Nuevos campos para eventos de pago y registro
    price?: number | null;
    registration_form_url?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
}

export interface CreateEventData {
    title: string;
    description?: string;
    category?: string;
    image?: string | null;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    user_id?: string | null;
    // Nuevos campos para eventos de pago y registro
    price?: number | null;
    registration_form_url?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
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
        description: string;
        location: string;
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

export interface UrlAnalysisResult extends AnalysisResult {
    source_url: string;
    platform: 'instagram';
    extracted_image_url: string;
    post_metadata?: {
        author?: string;
        description?: string;
    };
}

/**
 * Analyze an event from an Instagram post URL
 */
export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
    const response = await api.post('/events/analyze-url', { url });
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

export default api;
