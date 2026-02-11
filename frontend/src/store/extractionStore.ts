// Unified extraction store with Supabase persistence and polling
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { triggerExtraction, triggerAnalysis } from '../services/api';

export type ExtractionStatus =
    | 'pending'
    | 'extracting'
    | 'ready'
    | 'analyzing'
    | 'completed'
    | 'failed';

export interface Extraction {
    id: string;
    url: string;
    status: ExtractionStatus;
    images?: string[];
    selectedImage?: string;
    analysis?: {
        event_name: string;
        date: string;
        time: string;
        description: string;
        location: string;
        organizer?: string;
    };
    error?: string;
    createdAt: number;
    updatedAt: number;
}

interface ExtractionStore {
    extractions: Extraction[];
    isPolling: boolean;
    pollingInterval: ReturnType<typeof setInterval> | null;

    // Create job in Supabase and trigger backend processing
    queueExtraction: (url: string, userId: string) => Promise<string | null>;

    // Fetch all extractions from Supabase
    fetchExtractions: (userId: string) => Promise<void>;

    // Start/stop polling for updates
    startPolling: (userId: string) => void;
    stopPolling: () => void;

    // Select image and trigger analysis
    selectImage: (id: string, imageUrl: string) => Promise<void>;

    // Retry failed extraction (reset to ready if has images)
    retryExtraction: (id: string) => Promise<void>;

    // Delete from Supabase
    removeExtraction: (id: string) => Promise<void>;

    // Clear completed/failed extractions
    clearCompleted: (userId: string) => Promise<void>;

    // Get single extraction
    getExtraction: (id: string) => Extraction | undefined;
}

// Map Supabase row to Extraction interface
const mapToExtraction = (row: any): Extraction => ({
    id: row.id,
    url: row.source_url,
    status: row.status as ExtractionStatus,
    images: row.extracted_images || undefined,
    selectedImage: row.selected_image_url || undefined,
    analysis: row.analysis_result || undefined,
    error: row.error_message || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
});

export const useExtractionStore = create<ExtractionStore>()((set, get) => ({
    extractions: [],
    isPolling: false,
    pollingInterval: null,

    queueExtraction: async (url: string, userId: string) => {
        try {
            // Insert into Supabase
            const { data, error } = await supabase
                .from('extraction_jobs')
                .insert({
                    user_id: userId,
                    source_url: url,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) {
                console.error('[EXTRACTION_STORE] Failed to create job:', error);
                return null;
            }

            // Add to local state immediately
            const newExtraction = mapToExtraction(data);
            set(state => ({
                extractions: [newExtraction, ...state.extractions]
            }));

            // Fire-and-forget trigger to backend
            triggerExtraction(data.id);

            return data.id;
        } catch (error: any) {
            console.error('[EXTRACTION_STORE] Queue extraction error:', error);
            return null;
        }
    },

    fetchExtractions: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('extraction_jobs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[EXTRACTION_STORE] Failed to fetch extractions:', error);
                return;
            }

            const extractions = (data || []).map(mapToExtraction);
            set({ extractions });
        } catch (error: any) {
            console.error('[EXTRACTION_STORE] Fetch error:', error);
        }
    },

    startPolling: (userId: string) => {
        const { isPolling, pollingInterval } = get();

        // Don't start if already polling
        if (isPolling || pollingInterval) return;

        console.log('[EXTRACTION_STORE] Starting polling for user:', userId);
        set({ isPolling: true });

        // Initial fetch
        get().fetchExtractions(userId);

        // Poll every 3 seconds - always fetch to catch updates
        const interval = setInterval(() => {
            console.log('[EXTRACTION_STORE] Polling...');
            get().fetchExtractions(userId);
        }, 3000);

        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
            console.log('[EXTRACTION_STORE] Stopping polling');
            clearInterval(pollingInterval);
            set({ isPolling: false, pollingInterval: null });
        }
    },

    selectImage: async (id: string, imageUrl: string) => {
        const extraction = get().extractions.find(e => e.id === id);
        // Allow selection if status is 'ready' OR 'failed' with images (retry scenario)
        if (!extraction) return;
        if (extraction.status !== 'ready' && extraction.status !== 'failed') return;
        if (!extraction.images?.length) return;

        // Optimistically update local state
        set(state => ({
            extractions: state.extractions.map(e =>
                e.id === id
                    ? { ...e, status: 'analyzing' as const, selectedImage: imageUrl, error: undefined, updatedAt: Date.now() }
                    : e
            )
        }));

        // Update Supabase to reset error and set analyzing status
        await supabase
            .from('extraction_jobs')
            .update({
                status: 'analyzing',
                selected_image_url: imageUrl,
                error_message: null,
            })
            .eq('id', id);

        // Fire-and-forget trigger to backend
        triggerAnalysis(id, imageUrl);
    },

    retryExtraction: async (id: string) => {
        const extraction = get().extractions.find(e => e.id === id);
        if (!extraction || extraction.status !== 'failed') return;

        // If has images, reset to 'ready' so user can select again
        if (extraction.images?.length) {
            set(state => ({
                extractions: state.extractions.map(e =>
                    e.id === id
                        ? { ...e, status: 'ready' as const, error: undefined, updatedAt: Date.now() }
                        : e
                )
            }));

            // Update Supabase
            await supabase
                .from('extraction_jobs')
                .update({ status: 'ready', error_message: null })
                .eq('id', id);
        } else {
            // No images, need to re-extract - reset to pending
            set(state => ({
                extractions: state.extractions.map(e =>
                    e.id === id
                        ? { ...e, status: 'pending' as const, error: undefined, updatedAt: Date.now() }
                        : e
                )
            }));

            // Update Supabase and trigger extraction again
            await supabase
                .from('extraction_jobs')
                .update({ status: 'pending', error_message: null })
                .eq('id', id);

            triggerExtraction(id);
        }
    },

    removeExtraction: async (id: string) => {
        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('extraction_jobs')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('[EXTRACTION_STORE] Failed to delete:', error);
                return;
            }

            // Remove from local state
            set(state => ({
                extractions: state.extractions.filter(e => e.id !== id)
            }));
        } catch (error: any) {
            console.error('[EXTRACTION_STORE] Delete error:', error);
        }
    },

    clearCompleted: async (userId: string) => {
        try {
            // Delete completed/failed from Supabase
            const { error } = await supabase
                .from('extraction_jobs')
                .delete()
                .eq('user_id', userId)
                .in('status', ['completed', 'failed']);

            if (error) {
                console.error('[EXTRACTION_STORE] Failed to clear completed:', error);
                return;
            }

            // Remove from local state
            set(state => ({
                extractions: state.extractions.filter(e =>
                    e.status !== 'completed' && e.status !== 'failed'
                )
            }));
        } catch (error: any) {
            console.error('[EXTRACTION_STORE] Clear completed error:', error);
        }
    },

    getExtraction: (id: string) => get().extractions.find(e => e.id === id),
}));
