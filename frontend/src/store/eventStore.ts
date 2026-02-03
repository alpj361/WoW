import { create } from 'zustand';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import type { EventRegistration } from '../services/api';

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
  // Attendance tracking
  requires_attendance_check?: boolean | null;
}

export interface SavedEventData {
  saved: {
    id: string;
    event_id: string;
    saved_at: string;
  };
  event: Event;
  registration?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string | null;
  } | null;
}

export interface AttendedEventData {
  attended: {
    id: string;
    event_id: string;
    emoji_rating: string | null;
    reaction_sticker: string | null;
    reaction_gif: string | null;
    reaction_comment: string | null;
    attended_at: string;
  };
  event: Event;
}

export interface DeniedEventData {
  id: string;
  event_id: string;
  denied_at: string;
}

export interface HostedEventData {
  event: Event & {
    attendee_count?: number;
  };
}

export interface PublicReaction {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  emoji_rating: string | null;
  reaction_sticker: string | null;
  reaction_gif: string | null;
  reaction_comment: string | null;
  attended_at: string;
}

interface EventStore {
  events: Event[];
  savedEvents: SavedEventData[];
  attendedEvents: AttendedEventData[];
  hostedEvents: HostedEventData[];
  deniedEvents: DeniedEventData[];
  currentCategory: string;
  isLoading: boolean;
  error: string | null;

  // Registration management
  pendingRegistrations: EventRegistration[];
  userRegistrations: EventRegistration[];

  // Actions
  fetchEvents: (category?: string) => Promise<void>;
  fetchSavedEvents: () => Promise<void>;
  fetchAttendedEvents: () => Promise<void>;
  fetchHostedEvents: () => Promise<void>;
  fetchDeniedEvents: () => Promise<void>;
  fetchEventAttendees: (eventId: string) => Promise<any[]>;
  saveEvent: (eventId: string) => Promise<void>;
  unsaveEvent: (eventId: string) => Promise<void>;
  denyEvent: (eventId: string) => Promise<void>;
  markAttended: (eventId: string, emoji?: string) => Promise<void>;
  updateEventReaction: (eventId: string, reaction: { emoji_rating?: string | null; reaction_sticker?: string | null; reaction_gif?: string | null; reaction_comment?: string | null }) => Promise<void>;
  fetchPublicReactions: (eventId: string) => Promise<PublicReaction[]>;
  removeAttended: (eventId: string) => Promise<void>;
  createEvent: (eventData: Partial<Event> & { user_id?: string | null }) => Promise<Event>;
  setCategory: (category: string) => void;

  // Registration actions
  registerForEvent: (eventId: string, paymentReceiptUrl?: string, registrationFormCompleted?: boolean) => Promise<void>;
  fetchEventRegistrations: (eventId: string) => Promise<EventRegistration[]>;
  fetchUserRegistrations: () => Promise<void>;
  approveRegistration: (registrationId: string) => Promise<void>;
  rejectRegistration: (registrationId: string, rejectionReason?: string) => Promise<void>;
  resubmitRegistration: (eventId: string, paymentReceiptUrl?: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  savedEvents: [],
  attendedEvents: [],
  hostedEvents: [],
  deniedEvents: [],
  currentCategory: 'all',
  isLoading: false,
  error: null,
  pendingRegistrations: [],
  userRegistrations: [],

  fetchEvents: async (category?: string) => {
    set({ isLoading: true, error: null });

    try {
      const cat = category || get().currentCategory;
      const events = await api.fetchEvents(cat);

      // Filter events:
      // 1. Remove events that are already saved (liked)
      // 2. Remove events that are denied within the last 48 hours
      const { savedEvents, deniedEvents } = get();
      const savedEventIds = new Set(savedEvents.map(s => s.event.id));

      const now = new Date();
      const deniedEventIds = new Set(
        deniedEvents
          .filter(d => {
            const deniedDate = new Date(d.denied_at);
            const hoursDiff = (now.getTime() - deniedDate.getTime()) / (1000 * 60 * 60);
            return hoursDiff < 48; // Keep only if denied less than 48h ago
          })
          .map(d => d.event_id)
      );

      const filteredEvents = events.filter(event =>
        !savedEventIds.has(event.id) && !deniedEventIds.has(event.id)
      );

      set({ events: filteredEvents, isLoading: false });
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
            created_at,
            price,
            registration_form_url,
            bank_name,
            bank_account_number,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      // DEBUG: Log raw data from Supabase
      console.log('[FETCH SAVED] Raw data from Supabase:', JSON.stringify(data?.slice(0, 2), null, 2));

      // Fetch registrations for these events
      const eventIds = (data || []).map((item: any) => item.event_id);
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id, event_id, status, rejection_reason')
        .eq('user_id', user.id)
        .in('event_id', eventIds);

      const registrationMap = new Map(
        (registrations || []).map(reg => [reg.event_id, reg])
      );

      const savedEvents: SavedEventData[] = (data || []).map((item: any) => ({
        saved: {
          id: item.id,
          event_id: item.event_id,
          saved_at: item.saved_at,
        },
        event: item.events,
        registration: registrationMap.get(item.event_id) || null,
      }));

      // DEBUG: Check which events have images
      console.log('[SAVED EVENTS] Summary:');
      savedEvents.forEach((se, idx) => {
        console.log(`  [${idx}] ${se.event.title}: image=${se.event.image ? 'YES (' + se.event.image.substring(0, 30) + '...)' : 'NO'}`);
      });

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
            created_at,
            price,
            registration_form_url,
            bank_name,
            bank_account_number,
            user_id
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
          reaction_sticker: item.reaction_sticker || null,
          reaction_gif: item.reaction_gif || null,
          reaction_comment: item.reaction_comment || null,
          attended_at: item.attended_at,
        },
        event: item.events,
      }));

      // DEBUG: Check attended events images
      console.log('[ATTENDED EVENTS] Summary:');
      attendedEvents.forEach((ae, idx) => {
        console.log(`  [${idx}] ${ae.event.title}: image=${ae.event.image ? 'YES (' + ae.event.image.substring(0, 30) + '...)' : 'NO'}`);
      });

      set({ attendedEvents, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching attended events:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchHostedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, hostedEvents: [] });
        return;
      }

      const events = await api.fetchHostedEvents(user.id);

      // DEBUG: Check hosted events images
      console.log('[HOSTED EVENTS] Summary:');
      events.forEach((event, idx) => {
        console.log(`  [${idx}] ${event.title}: image=${event.image ? 'YES (' + event.image.substring(0, 30) + '...)' : 'NO'}`);
      });

      set({
        hostedEvents: events.map(event => ({ event })),
        isLoading: false
      });
    } catch (error: any) {
      console.error('Error fetching hosted events:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDeniedEvents: async () => {
    // Don't set global loading here to avoid flickering if called in background
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ deniedEvents: [] });
        return;
      }

      const { data, error } = await supabase
        .from('denied_events')
        .select('id, event_id, denied_at')
        .eq('user_id', user.id);

      if (error) throw error;

      set({ deniedEvents: data as DeniedEventData[] });
    } catch (error: any) {
      console.error('Error fetching denied events:', error);
      // We don't block the UI for this error
    }
  },

  denyEvent: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Silent fail if not logged in

      // Optimistic update: remove from current events list - REMOVED to preserve list index stability
      // The UI handles "next card" transition separately.
      // set(state => ({
      //     events: state.events.filter(e => e.id !== eventId)
      // }));

      const { data, error } = await supabase
        .from('denied_events')
        .insert({
          user_id: user.id,
          event_id: eventId
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        deniedEvents: [...state.deniedEvents, data as DeniedEventData]
      }));

    } catch (error: any) {
      console.error('Error denying event:', error);
    }
  },

  fetchEventAttendees: async (eventId: string) => {
    try {
      return await api.fetchEventAttendees(eventId);
    } catch (error: any) {
      console.error('Error fetching attendees:', error);
      throw error;
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
            reaction_sticker: data.reaction_sticker || null,
            reaction_gif: data.reaction_gif || null,
            reaction_comment: data.reaction_comment || null,
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

  updateEventReaction: async (eventId: string, reaction: { emoji_rating?: string | null; reaction_sticker?: string | null; reaction_gif?: string | null; reaction_comment?: string | null }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const updateData: Record<string, any> = {};
      if (reaction.emoji_rating !== undefined) updateData.emoji_rating = reaction.emoji_rating;
      if (reaction.reaction_sticker !== undefined) updateData.reaction_sticker = reaction.reaction_sticker;
      if (reaction.reaction_gif !== undefined) updateData.reaction_gif = reaction.reaction_gif;
      if (reaction.reaction_comment !== undefined) updateData.reaction_comment = reaction.reaction_comment;

      const { error } = await supabase
        .from('attended_events')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;

      // Update local state
      set(state => ({
        attendedEvents: state.attendedEvents.map(ae =>
          ae.attended.event_id === eventId
            ? {
              ...ae,
              attended: {
                ...ae.attended,
                ...updateData,
              },
            }
            : ae
        ),
      }));
    } catch (error: any) {
      console.error('Error updating reaction:', error);
      throw error;
    }
  },

  fetchPublicReactions: async (eventId: string): Promise<PublicReaction[]> => {
    try {
      const { data, error } = await supabase
        .from('attended_events')
        .select(`
          id,
          user_id,
          emoji_rating,
          reaction_sticker,
          reaction_gif,
          reaction_comment,
          attended_at,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('attended_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'Usuario',
        user_avatar: item.profiles?.avatar_url || null,
        emoji_rating: item.emoji_rating,
        reaction_sticker: item.reaction_sticker,
        reaction_gif: item.reaction_gif,
        reaction_comment: item.reaction_comment,
        attended_at: item.attended_at,
      }));
    } catch (error: any) {
      console.error('Error fetching public reactions:', error);
      return [];
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

  createEvent: async (eventData: Partial<Event> & { user_id?: string | null }) => {
    try {
      const newEvent = await api.createEvent({
        title: eventData.title || '',
        description: eventData.description || undefined,
        category: eventData.category || 'general',
        image: eventData.image,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location || undefined,
        user_id: eventData.user_id || undefined,
        price: eventData.price || undefined,
        registration_form_url: eventData.registration_form_url || undefined,
        bank_account_number: eventData.bank_account_number || undefined,
        bank_name: eventData.bank_name || undefined,
        requires_attendance_check: eventData.requires_attendance_check || undefined,
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

  // Registration actions
  registerForEvent: async (eventId: string, paymentReceiptUrl?: string, registrationFormCompleted?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      await api.registerForEvent(eventId, user.id, paymentReceiptUrl, registrationFormCompleted);

      // Refresh user registrations
      await get().fetchUserRegistrations();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  fetchEventRegistrations: async (eventId: string) => {
    try {
      const registrations = await api.fetchEventRegistrations(eventId);
      set({ pendingRegistrations: registrations });
      return registrations;
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
      throw error;
    }
  },

  fetchUserRegistrations: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ userRegistrations: [] });
        return;
      }

      const registrations = await api.fetchUserRegistrations(user.id);
      set({ userRegistrations: registrations });
    } catch (error: any) {
      console.error('Error fetching user registrations:', error);
      set({ error: error.message });
    }
  },

  approveRegistration: async (registrationId: string) => {
    try {
      await api.approveRegistration(registrationId);

      // Update the registration in state
      set(state => ({
        pendingRegistrations: state.pendingRegistrations.map(reg =>
          reg.id === registrationId ? { ...reg, status: 'approved' as const } : reg
        ),
      }));
    } catch (error: any) {
      console.error('Error approving registration:', error);
      throw error;
    }
  },

  rejectRegistration: async (registrationId: string, rejectionReason?: string) => {
    try {
      await api.rejectRegistration(registrationId, rejectionReason);

      // Update the registration in state
      set(state => ({
        pendingRegistrations: state.pendingRegistrations.map(reg =>
          reg.id === registrationId
            ? { ...reg, status: 'rejected' as const, rejection_reason: rejectionReason || null }
            : reg
        ),
      }));
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      throw error;
    }
  },

  resubmitRegistration: async (eventId: string, paymentReceiptUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Delete old registration first
      const { error: deleteError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Create new registration
      await api.registerForEvent(eventId, user.id, paymentReceiptUrl);

      // Refresh user registrations
      await get().fetchUserRegistrations();
    } catch (error: any) {
      console.error('Error resubmitting registration:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        hostedEvents: state.hostedEvents.filter((e) => e.event.id !== eventId),
        events: state.events.filter((e) => e.id !== eventId),
      }));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
}));
