import { create } from 'zustand';
import * as api from '../services/api';
import { supabase } from '../services/supabase';

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, savedEvents: [] });
        return;
      }

      const { data, error } = await supabase
        .from('saved_events')
        .select(`
          id,
          event_id,
          saved_at,
          events (
            id,
            title,
            description,
            category,
            image,
            date,
            time,
            location,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      const savedEvents: SavedEventData[] = (data || []).map((item: any) => ({
        saved: {
          id: item.id,
          event_id: item.event_id,
          saved_at: item.saved_at,
        },
        event: item.events,
      }));

      set({ savedEvents, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching saved events:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAttendedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, attendedEvents: [] });
        return;
      }

      const { data, error } = await supabase
        .from('attended_events')
        .select(`
          id,
          event_id,
          emoji_rating,
          attended_at,
          events (
            id,
            title,
            description,
            category,
            image,
            date,
            time,
            location,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('attended_at', { ascending: false });

      if (error) throw error;

      const attendedEvents: AttendedEventData[] = (data || []).map((item: any) => ({
        attended: {
          id: item.id,
          event_id: item.event_id,
          emoji_rating: item.emoji_rating,
          attended_at: item.attended_at,
        },
        event: item.events,
      }));

      set({ attendedEvents, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching attended events:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  saveEvent: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const event = get().events.find(e => e.id === eventId);
      if (!event) return;

      // Check if already saved
      const alreadySaved = get().savedEvents.some(s => s.event.id === eventId);
      if (alreadySaved) return;

      const { data, error } = await supabase
        .from('saved_events')
        .insert({
          user_id: user.id,
          event_id: eventId,
        })
        .select()
        .single();

      if (error) throw error;

      const savedEvent: SavedEventData = {
        saved: {
          id: data.id,
          event_id: data.event_id,
          saved_at: data.saved_at,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get event from saved or from all events
      let event = get().savedEvents.find(s => s.event.id === eventId)?.event;
      if (!event) {
        event = get().events.find(e => e.id === eventId);
      }
      if (!event) return;

      // Check if already attended - if so, update emoji rating
      const existingAttended = get().attendedEvents.find(a => a.event.id === eventId);

      if (existingAttended) {
        // Update existing
        const { error } = await supabase
          .from('attended_events')
          .update({ emoji_rating: emoji || null })
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;

        set(state => ({
          attendedEvents: state.attendedEvents.map(a =>
            a.event.id === eventId
              ? { ...a, attended: { ...a.attended, emoji_rating: emoji || null } }
              : a
          ),
        }));
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('attended_events')
          .insert({
            user_id: user.id,
            event_id: eventId,
            emoji_rating: emoji || null,
          })
          .select()
          .single();

        if (error) throw error;

        const attendedEvent: AttendedEventData = {
          attended: {
            id: data.id,
            event_id: data.event_id,
            emoji_rating: data.emoji_rating,
            attended_at: data.attended_at,
          },
          event,
        };

        // Remove from saved if it was saved
        await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        set(state => ({
          attendedEvents: [...state.attendedEvents, attendedEvent],
          savedEvents: state.savedEvents.filter(s => s.event.id !== eventId),
        }));
      }
    } catch (error: any) {
      console.error('Error marking attended:', error);
      throw error;
    }
  },

  removeAttended: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('attended_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;

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
