// Draft store for managing event drafts with Supabase persistence
import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface EventDraft {
  id: string;
  user_id: string;
  extraction_job_id?: string | null;
  title: string;
  description?: string | null;
  category: string;
  image?: string | null;
  date?: string | null;
  time?: string | null;
  end_time?: string | null;
  location?: string | null;
  organizer?: string | null;
  price?: number | null;
  registration_form_url?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  source_image_url?: string | null;
  is_recurring?: boolean | null;
  recurring_dates?: string[] | null;
  created_at: string;
  updated_at: string;
}

export type DraftFormData = Omit<EventDraft, 'id' | 'created_at' | 'updated_at'>;

interface DraftStore {
  drafts: EventDraft[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  fetchDrafts: (userId: string) => Promise<void>;
  saveDraft: (draft: DraftFormData) => Promise<string | null>;
  updateDraft: (id: string, data: Partial<EventDraft>) => Promise<boolean>;
  deleteDraft: (id: string) => Promise<boolean>;

  // Publish draft → creates event and deletes draft
  publishDraft: (id: string) => Promise<boolean>;

  // Get single draft
  getDraft: (id: string) => EventDraft | undefined;

  // Clear error
  clearError: () => void;
}

export const useDraftStore = create<DraftStore>()((set, get) => ({
  drafts: [],
  isLoading: false,
  error: null,

  fetchDrafts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DRAFT_STORE] Failed to fetch drafts:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ drafts: data || [], isLoading: false });
    } catch (error: any) {
      console.error('[DRAFT_STORE] Fetch error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  saveDraft: async (draft: DraftFormData) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('event_drafts')
        .insert({
          user_id: draft.user_id,
          extraction_job_id: draft.extraction_job_id || null,
          title: draft.title,
          description: draft.description || null,
          category: draft.category || 'general',
          image: draft.image || null,
          date: draft.date || null,
          time: draft.time || null,
          end_time: draft.end_time || null,
          location: draft.location || null,
          organizer: draft.organizer || null,
          price: draft.price || null,
          registration_form_url: draft.registration_form_url || null,
          bank_name: draft.bank_name || null,
          bank_account_number: draft.bank_account_number || null,
          source_image_url: draft.source_image_url || null,
          is_recurring: draft.is_recurring || null,
          recurring_dates: draft.recurring_dates || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[DRAFT_STORE] Failed to save draft:', error);
        set({ error: error.message, isLoading: false });
        return null;
      }

      // Add to local state
      set(state => ({
        drafts: [data, ...state.drafts],
        isLoading: false
      }));

      return data.id;
    } catch (error: any) {
      console.error('[DRAFT_STORE] Save error:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  updateDraft: async (id: string, data: Partial<EventDraft>) => {
    set({ isLoading: true, error: null });
    try {
      // Remove fields that shouldn't be updated
      const { id: _, user_id, created_at, updated_at, ...updateData } = data as any;

      const { error } = await supabase
        .from('event_drafts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('[DRAFT_STORE] Failed to update draft:', error);
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Update local state
      set(state => ({
        drafts: state.drafts.map(d =>
          d.id === id ? { ...d, ...updateData, updated_at: new Date().toISOString() } : d
        ),
        isLoading: false
      }));

      return true;
    } catch (error: any) {
      console.error('[DRAFT_STORE] Update error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  deleteDraft: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('event_drafts')
        .delete()
        .eq('id', id);

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Remove from local state
      set(state => ({
        drafts: state.drafts.filter(d => d.id !== id),
        isLoading: false
      }));

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  publishDraft: async (id: string) => {
    const draft = get().drafts.find(d => d.id === id);
    if (!draft) {
      set({ error: 'Borrador no encontrado' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      // Create event from draft data
      const { data: eventData, error: createError } = await supabase
        .from('events')
        .insert({
          title: draft.title,
          description: draft.description,
          category: draft.category,
          image: draft.image,
          date: draft.date,
          time: draft.time,
          end_time: draft.end_time,
          location: draft.location,
          organizer: draft.organizer,
          price: draft.price,
          registration_form_url: draft.registration_form_url,
          bank_name: draft.bank_name,
          bank_account_number: draft.bank_account_number,
          is_recurring: draft.is_recurring,
          recurring_dates: draft.recurring_dates,
          user_id: null, // Not a hosted event by default
        })
        .select()
        .single();

      if (createError) {
        console.error('[DRAFT_STORE] Failed to create event from draft:', createError);
        set({ error: createError.message, isLoading: false });
        return false;
      }

      // Delete the draft after successful event creation
      const { error: deleteError } = await supabase
        .from('event_drafts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.warn('[DRAFT_STORE] Event created but failed to delete draft:', deleteError);
        // Don't fail the operation, just warn
      }

      // Remove from local state
      set(state => ({
        drafts: state.drafts.filter(d => d.id !== id),
        isLoading: false
      }));

      return true;
    } catch (error: any) {
      console.error('[DRAFT_STORE] Publish error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  getDraft: (id: string) => get().drafts.find(d => d.id === id),

  clearError: () => set({ error: null }),
}));
