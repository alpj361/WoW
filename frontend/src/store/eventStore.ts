import { create } from 'zustand';
import * as api from '../services/api';

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
      const events = await api.fetchEvents(cat);
      set({ events, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
      set({ error: error.message, isLoading: false, events: [] });
    }
  },

  fetchSavedEvents: async () => {
    set({ isLoading: true, error: null });
    // TODO: Implement with Supabase when user auth is added
    set({ isLoading: false });
  },

  fetchAttendedEvents: async () => {
    set({ isLoading: true, error: null });
    // TODO: Implement with Supabase when user auth is added
    set({ isLoading: false });
  },

  saveEvent: async (eventId: string) => {
    try {
      const event = get().events.find(e => e.id === eventId);
      if (!event) return;

      const savedEvent: SavedEventData = {
        saved: {
          id: `saved-${eventId}`,
          event_id: eventId,
          saved_at: new Date().toISOString(),
        },
        event,
      };

      set(state => ({
        savedEvents: [...state.savedEvents, savedEvent],
      }));
    } catch (error: any) {
      console.error('Error saving event:', error);
      throw error;
    }
  },

  unsaveEvent: async (eventId: string) => {
    try {
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
      const event = get().events.find(e => e.id === eventId);
      if (!event) return;

      const attendedEvent: AttendedEventData = {
        attended: {
          id: `attended-${eventId}`,
          event_id: eventId,
          emoji_rating: emoji || null,
          attended_at: new Date().toISOString(),
        },
        event,
      };

      set(state => ({
        attendedEvents: [...state.attendedEvents, attendedEvent],
        savedEvents: state.savedEvents.filter(s => s.event.id !== eventId),
      }));
    } catch (error: any) {
      console.error('Error marking attended:', error);
      throw error;
    }
  },

  removeAttended: async (eventId: string) => {
    try {
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
      const newEvent = await api.createEvent({
        title: eventData.title || '',
        description: eventData.description || undefined,
        category: eventData.category || 'general',
        image: eventData.image,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location || undefined,
      });

      // Refresh events list
      get().fetchEvents();

      return newEvent;
    } catch (error: any) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  setCategory: (category: string) => {
    set({ currentCategory: category });
    get().fetchEvents(category);
  },
}));
