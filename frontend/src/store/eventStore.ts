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
  event_features?: { mood?: string; vibe?: string; timeOfDay?: string; socialSetting?: string } | null;
  // Reservations
  reservation_contact?: string | null;
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
    attendance_date?: string | null;
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

  // Granular loading states
  isLoadingFeed: boolean;
  isLoadingSaved: boolean;
  isLoadingAttended: boolean;
  isLoadingHosted: boolean;

  // Data freshness tracking
  feedLastUpdated: number;
  savedLastUpdated: number;
  hasNewFeedData: boolean;
  hasNewSavedData: boolean;

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
  markAttended: (eventId: string, emoji?: string, date?: string) => Promise<void>;
  updateEventReaction: (eventId: string, reaction: { emoji_rating?: string | null; reaction_sticker?: string | null; reaction_gif?: string | null; reaction_comment?: string | null }) => Promise<void>;
  removeAttendedEvent: (eventId: string) => Promise<void>; // Add this line
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
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Not attended signal
  markNotAttended: (eventId: string) => Promise<void>;

  // Silent refresh (background, no loading indicator)
  silentRefreshFeed: () => Promise<boolean>;
  silentRefreshSaved: () => Promise<boolean>;
  clearNewDataFlags: () => void;
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

  // Granular loading states
  isLoadingFeed: false,
  isLoadingSaved: false,
  isLoadingAttended: false,
  isLoadingHosted: false,

  // Data freshness
  feedLastUpdated: 0,
  savedLastUpdated: 0,
  hasNewFeedData: false,
  hasNewSavedData: false,

  pendingRegistrations: [],
  userRegistrations: [],

  fetchEvents: async (category?: string) => {
    set({ isLoading: true, isLoadingFeed: true, error: null });

    try {
      const cat = category || get().currentCategory;
      const events = await api.fetchEvents(cat);

      // Filter events:
      // 1. Remove events that are already saved (liked)
      // 2. Remove events that are denied (permanently)
      const { savedEvents, deniedEvents } = get();
      const savedEventIds = new Set(savedEvents.map(s => s.event.id));

      // Filter out ALL denied events permanently (no 48hr window)
      const deniedEventIds = new Set(deniedEvents.map(d => d.event_id));

      // Filter out expired events (past date, considering recurring dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filteredEvents = events.filter(event => {
        // Date filtering: remove expired events
        if (event.date) {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          const isExpired = eventDate < today;

          if (isExpired) {
            // Check if any recurring date is still valid
            if (event.is_recurring && event.recurring_dates && event.recurring_dates.length > 0) {
              const hasUpcoming = event.recurring_dates.some(d => {
                const rd = new Date(d);
                rd.setHours(0, 0, 0, 0);
                return rd >= today;
              });
              if (!hasUpcoming) return false;
            } else {
              return false;
            }
          }
        }

        return !savedEventIds.has(event.id) && !deniedEventIds.has(event.id);
      });

      set({
        events: filteredEvents,
        isLoading: false,
        isLoadingFeed: false,
        feedLastUpdated: Date.now(),
        hasNewFeedData: false,
      });
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
      set({ error: error.message, isLoading: false, isLoadingFeed: false, events: [] });
    }
  },

  fetchSavedEvents: async () => {
    set({ isLoadingSaved: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoadingSaved: false, savedEvents: [] });
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

      set({ savedEvents, isLoadingSaved: false, savedLastUpdated: Date.now(), hasNewSavedData: false });
    } catch (error: any) {
      console.error('Error fetching saved events:', error);
      set({ error: error.message, isLoadingSaved: false });
    }
  },

  fetchAttendedEvents: async () => {
    set({ isLoadingAttended: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoadingAttended: false, attendedEvents: [] });
        return;
      }

      const { data, error } = await supabase
        .from('attended_events')
        .select(`
          id,
          event_id,
          emoji_rating,
          attended_at,
          attendance_date,
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
          attendance_date: item.attendance_date,
        },
        event: item.events,
      }));

      // DEBUG: Check attended events images
      console.log('[ATTENDED EVENTS] Summary:');
      attendedEvents.forEach((ae, idx) => {
        console.log(`  [${idx}] ${ae.event.title}: image=${ae.event.image ? 'YES (' + ae.event.image.substring(0, 30) + '...)' : 'NO'}`);
      });

      set({ attendedEvents, isLoadingAttended: false });
    } catch (error: any) {
      console.error('Error fetching attended events:', error);
      set({ error: error.message, isLoadingAttended: false });
    }
  },

  fetchHostedEvents: async () => {
    set({ isLoadingHosted: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoadingHosted: false, hostedEvents: [] });
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
        isLoadingHosted: false
      });
    } catch (error: any) {
      console.error('Error fetching hosted events:', error);
      set({ error: error.message, isLoadingHosted: false });
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

  markAttended: async (eventId: string, emoji?: string, date?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get event from saved or from all events
      let event = get().savedEvents.find(s => s.event.id === eventId)?.event;
      if (!event) {
        event = get().events.find(e => e.id === eventId);
      }
      if (!event) return;

      // Check if already attended on this date (or at all if no date provided)
      const existingAttended = get().attendedEvents.find(a =>
        a.event.id === eventId &&
        (date ? a.attended.attendance_date === date : true)
      );

      if (existingAttended) {
        // Update existing
        // We need to identify WHICH record to update. 
        // If date is provided, we found the exact one. 
        // If no date, we update the first one found (legacy behavior) or maybe most recent?
        // Using existingAttended.attended.id is safest.

        const { error } = await supabase
          .from('attended_events')
          .update({ emoji_rating: emoji || null })
          .eq('user_id', user.id)
          .eq('id', existingAttended.attended.id); // Update by specific ID

        if (error) throw error;

        set(state => ({
          attendedEvents: state.attendedEvents.map(a =>
            a.attended.id === existingAttended.attended.id
              ? { ...a, attended: { ...a.attended, emoji_rating: emoji || null } }
              : a
          ),
        }));
      } else {
        // Insert new
        const insertData: any = {
          user_id: user.id,
          event_id: eventId,
          emoji_rating: emoji || null,
        };
        if (date) {
          insertData.attendance_date = date;
        }

        const { data, error } = await supabase
          .from('attended_events')
          .insert(insertData)
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
            attendance_date: data.attendance_date,
          },
          event,
        };

        // Remove from saved if it was saved (only if it's the first attendance? or always?)
        // Usually if I attend, I don't need it in saved anymore.
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

  removeAttendedEvent: async (eventId: string) => {
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
        attendedEvents: state.attendedEvents.filter(ae => ae.attended.event_id !== eventId)
      }));
    } catch (error: any) {
      console.error('Error removing attended event:', error);
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
      const isBase64 = !!eventData.image && eventData.image.startsWith('data:');

      const newEvent = await api.createEvent({
        title: eventData.title || '',
        description: eventData.description || undefined,
        category: eventData.category || 'general',
        // If base64, create with null — storage upload below will update it
        image: isBase64 ? null : (eventData.image || undefined),
        date: eventData.date,
        time: eventData.time,
        end_time: eventData.end_time || undefined,
        location: eventData.location || undefined,
        organizer: eventData.organizer || undefined,
        user_id: eventData.user_id || undefined,
        price: eventData.price || undefined,
        registration_form_url: eventData.registration_form_url || undefined,
        reservation_contact: eventData.reservation_contact || undefined,
        bank_account_number: eventData.bank_account_number || undefined,
        bank_name: eventData.bank_name || undefined,
        requires_attendance_check: eventData.requires_attendance_check || undefined,
        is_recurring: eventData.is_recurring || undefined,
        recurring_dates: eventData.recurring_dates || undefined,
        target_audience: eventData.target_audience || undefined,
        subcategory: eventData.subcategory || undefined,
        tags: eventData.tags || undefined,
        event_features: eventData.event_features || undefined,
      });

      // Upload base64 image to storage and auto-update event.image in DB
      if (isBase64 && newEvent.id) {
        try {
          await api.uploadImageBase64(eventData.image!, newEvent.id);
        } catch (uploadErr) {
          console.error('Image upload failed after event creation:', uploadErr);
          // Non-fatal — event is created, image just won't show
        }
      }

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

  updateEvent: async (eventId: string, eventData: Partial<Event>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // If image is a new base64, upload to storage first to get a permanent URL
      let imageToSave = eventData.image ?? undefined;
      if (imageToSave && imageToSave.startsWith('data:')) {
        const uploadResult = await api.uploadImageBase64(imageToSave, eventId);
        if (uploadResult.success && uploadResult.publicUrl) {
          imageToSave = uploadResult.publicUrl;
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          image: imageToSave,
          date: eventData.date,
          time: eventData.time,
          end_time: eventData.end_time,
          location: eventData.location,
          organizer: eventData.organizer,
          price: eventData.price,
          registration_form_url: eventData.registration_form_url,
          reservation_contact: eventData.reservation_contact,
          bank_name: eventData.bank_name,
          bank_account_number: eventData.bank_account_number,
          requires_attendance_check: eventData.requires_attendance_check,
          is_recurring: eventData.is_recurring,
          recurring_dates: eventData.recurring_dates,
          target_audience: eventData.target_audience,
          subcategory: eventData.subcategory,
          tags: eventData.tags,
          event_features: eventData.event_features,
        })
        .eq('id', eventId);

      if (error) throw error;

      // Optimistic local update — reflect changes immediately without waiting for a full refetch
      set(state => ({
        hostedEvents: state.hostedEvents.map(he =>
          he.event.id === eventId
            ? { ...he, event: { ...he.event, ...eventData } }
            : he
        ),
        events: state.events.map(e =>
          e.id === eventId ? { ...e, ...eventData } : e
        ),
        savedEvents: state.savedEvents.map(se =>
          se.event.id === eventId
            ? { ...se, event: { ...se.event, ...eventData } }
            : se
        ),
      }));

      // Background refetch to ensure full consistency
      get().fetchHostedEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // 1. Delete denied events
      const { error: deniedError } = await supabase
        .from('denied_events')
        .delete()
        .eq('event_id', eventId);

      if (deniedError) {
        console.error('Error deleting denied_events:', deniedError);
        // Continue anyway, maybe it didn't exist or another issue, but try valid attempts
      }

      // 2. Delete event registrations
      const { error: regError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId);

      if (regError) console.error('Error deleting registrations:', regError);

      // 3. Delete attended events
      const { error: attError } = await supabase
        .from('attended_events')
        .delete()
        .eq('event_id', eventId);

      if (attError) console.error('Error deleting attended events:', attError);

      // 4. Delete saved events references
      const { error: savedError } = await supabase
        .from('saved_events')
        .delete()
        .eq('event_id', eventId);

      if (savedError) console.error('Error deleting saved events:', savedError);

      // 5. Finally delete the event
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

  markNotAttended: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('not_attended_events')
        .upsert({ user_id: user.id, event_id: eventId });
      await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);
      set(state => ({ savedEvents: state.savedEvents.filter(e => e.event.id !== eventId) }));
    } catch (error: any) {
      console.error('Error marking not attended:', error);
    }
  },

  // Silent refresh - fetches in background without showing loading indicators
  // Returns true if new data was found
  silentRefreshFeed: async () => {
    try {
      const cat = get().currentCategory;
      const newEvents = await api.fetchEvents(cat);

      const { savedEvents, deniedEvents, events: currentEvents } = get();
      const savedEventIds = new Set(savedEvents.map(s => s.event.id));

      // Filter out ALL denied events permanently (no 48hr window)
      const deniedEventIds = new Set(deniedEvents.map(d => d.event_id));

      const filteredEvents = newEvents.filter(event =>
        !savedEventIds.has(event.id) && !deniedEventIds.has(event.id)
      );

      // Check if there's new data by comparing IDs
      const currentIds = new Set(currentEvents.map(e => e.id));
      const newIds = new Set(filteredEvents.map(e => e.id));
      const hasNew = filteredEvents.some(e => !currentIds.has(e.id)) ||
        currentEvents.some(e => !newIds.has(e.id));

      if (hasNew) {
        set({ hasNewFeedData: true });
      }

      return hasNew;
    } catch (error) {
      console.error('Silent refresh feed error:', error);
      return false;
    }
  },

  silentRefreshSaved: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('saved_events')
        .select('id, event_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const { savedEvents: currentSaved } = get();
      const currentIds = new Set(currentSaved.map(s => s.saved.event_id));
      const newIds = new Set((data || []).map((d: any) => d.event_id));

      const hasNew = (data || []).some((d: any) => !currentIds.has(d.event_id)) ||
        currentSaved.some(s => !newIds.has(s.saved.event_id));

      if (hasNew) {
        set({ hasNewSavedData: true });
      }

      return hasNew;
    } catch (error) {
      console.error('Silent refresh saved error:', error);
      return false;
    }
  },

  clearNewDataFlags: () => {
    set({ hasNewFeedData: false, hasNewSavedData: false });
  },
}));
