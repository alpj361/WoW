import axios from 'axios';

// Configure base URL - change for production
const API_BASE_URL = __DEV__
    ? 'http://localhost:3001/api'
    : 'https://your-domain.com/api';

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
    created_at: string;
}

export interface CreateEventData {
    title: string;
    description?: string;
    category?: string;
    image?: string | null;
    date?: string | null;
    time?: string | null;
    location?: string | null;
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

export default api;
