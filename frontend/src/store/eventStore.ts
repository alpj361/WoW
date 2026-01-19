import { create } from 'zustand';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  created_at: string;
}

export interface SavedEventData {
  saved: {
    id: string;
    event_id: string;
    saved_at: string;
  };
  event: Event;
}

export interface AttendedEventData {
  attended: {
    id: string;
    event_id: string;
    emoji_rating: string | null;
    attended_at: string;
  };
  event: Event;
}

interface EventStore {
  events: Event[];
  savedEvents: SavedEventData[];
  attendedEvents: AttendedEventData[];
  currentCategory: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchEvents: (category?: string) => Promise<void>;
  fetchSavedEvents: () => Promise<void>;
  fetchAttendedEvents: () => Promise<void>;
  saveEvent: (eventId: string) => Promise<void>;
  unsaveEvent: (eventId: string) => Promise<void>;
  markAttended: (eventId: string, emoji?: string) => Promise<void>;
  removeAttended: (eventId: string) => Promise<void>;
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  setCategory: (category: string) => void;
  seedData: () => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  savedEvents: [],
  attendedEvents: [],
  currentCategory: 'all',
  isLoading: false,
  error: null,

  fetchEvents: async (category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const cat = category || get().currentCategory;
      const url = cat && cat !== 'all' 
        ? `${API_URL}/api/events?category=${cat}`
        : `${API_URL}/api/events`;
      const response = await axios.get(url);
      set({ events: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching events:', error);
    }
  },

  fetchSavedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/saved`);
      set({ savedEvents: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching saved events:', error);
    }
  },

  fetchAttendedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/attended`);
      set({ attendedEvents: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching attended events:', error);
    }
  },

  saveEvent: async (eventId: string) => {
    try {
      await axios.post(`${API_URL}/api/events/${eventId}/save`);
      // Refresh saved events
      get().fetchSavedEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      throw error;
    }
  },

  unsaveEvent: async (eventId: string) => {
    try {
      await axios.delete(`${API_URL}/api/saved/${eventId}`);
      // Remove from local state
      set(state => ({
        savedEvents: state.savedEvents.filter(s => s.event.id !== eventId)
      }));
    } catch (error: any) {
      console.error('Error unsaving event:', error);
      throw error;
    }
  },

  markAttended: async (eventId: string, emoji?: string) => {
    try {
      await axios.post(`${API_URL}/api/events/${eventId}/attend`, {
        emoji_rating: emoji
      });
      // Refresh attended events and saved events
      get().fetchAttendedEvents();
      get().fetchSavedEvents();
    } catch (error: any) {
      console.error('Error marking attended:', error);
      throw error;
    }
  },

  removeAttended: async (eventId: string) => {
    try {
      await axios.delete(`${API_URL}/api/attended/${eventId}`);
      // Remove from local state
      set(state => ({
        attendedEvents: state.attendedEvents.filter(a => a.event.id !== eventId)
      }));
    } catch (error: any) {
      console.error('Error removing attended:', error);
      throw error;
    }
  },

  createEvent: async (eventData: Partial<Event>) => {
    try {
      const response = await axios.post(`${API_URL}/api/events`, eventData);
      // Refresh events list
      get().fetchEvents();
      return response.data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  setCategory: (category: string) => {
    set({ currentCategory: category });
    get().fetchEvents(category);
  },

  seedData: async () => {
    try {
      await axios.post(`${API_URL}/api/seed`);
      get().fetchEvents();
    } catch (error: any) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
}));
