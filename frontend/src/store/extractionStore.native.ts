// Native version - with AsyncStorage persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractUrl, analyzeExtractedImage } from '../services/api';

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
    };
    error?: string;
    createdAt: number;
    updatedAt: number;
}

interface ExtractionStore {
    extractions: Extraction[];
    isProcessing: boolean;
    queueExtraction: (url: string) => string;
    startExtraction: (id: string) => Promise<void>;
    selectImage: (id: string, imageUrl: string) => Promise<void>;
    removeExtraction: (id: string) => void;
    clearCompleted: () => void;
    getExtraction: (id: string) => Extraction | undefined;
    processQueue: () => Promise<void>;
}

export const useExtractionStore = create<ExtractionStore>()(
    persist(
        (set, get) => ({
            extractions: [],
            isProcessing: false,

            queueExtraction: (url: string) => {
                const id = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const now = Date.now();
                const newExtraction: Extraction = {
                    id, url, status: 'pending', createdAt: now, updatedAt: now,
                };
                set(state => ({ extractions: [newExtraction, ...state.extractions] }));
                setTimeout(() => get().processQueue(), 100);
                return id;
            },

            startExtraction: async (id: string) => {
                const extraction = get().extractions.find(e => e.id === id);
                if (!extraction || extraction.status !== 'pending') return;

                set(state => ({
                    extractions: state.extractions.map(e =>
                        e.id === id ? { ...e, status: 'extracting' as const, updatedAt: Date.now() } : e
                    )
                }));

                try {
                    const result = await extractUrl(extraction.url);
                    if (result.success && result.extracted_images?.length > 0) {
                        set(state => ({
                            extractions: state.extractions.map(e =>
                                e.id === id ? { ...e, status: 'ready' as const, images: result.extracted_images, updatedAt: Date.now() } : e
                            )
                        }));
                    } else {
                        set(state => ({
                            extractions: state.extractions.map(e =>
                                e.id === id ? { ...e, status: 'failed' as const, error: result.error || 'No se encontraron imágenes', updatedAt: Date.now() } : e
                            )
                        }));
                    }
                } catch (error: any) {
                    set(state => ({
                        extractions: state.extractions.map(e =>
                            e.id === id ? { ...e, status: 'failed' as const, error: error.message || 'Error de extracción', updatedAt: Date.now() } : e
                        )
                    }));
                }
            },

            selectImage: async (id: string, imageUrl: string) => {
                const extraction = get().extractions.find(e => e.id === id);
                if (!extraction || extraction.status !== 'ready') return;

                set(state => ({
                    extractions: state.extractions.map(e =>
                        e.id === id ? { ...e, status: 'analyzing' as const, selectedImage: imageUrl, updatedAt: Date.now() } : e
                    )
                }));

                try {
                    const result = await analyzeExtractedImage(imageUrl, 'Event Flyer');
                    if (result.success && result.analysis) {
                        set(state => ({
                            extractions: state.extractions.map(e =>
                                e.id === id ? { ...e, status: 'completed' as const, analysis: result.analysis, updatedAt: Date.now() } : e
                            )
                        }));
                    } else {
                        set(state => ({
                            extractions: state.extractions.map(e =>
                                e.id === id ? { ...e, status: 'completed' as const, error: 'Análisis no disponible', updatedAt: Date.now() } : e
                            )
                        }));
                    }
                } catch (error: any) {
                    set(state => ({
                        extractions: state.extractions.map(e =>
                            e.id === id ? { ...e, status: 'completed' as const, error: error.message || 'Error de análisis', updatedAt: Date.now() } : e
                        )
                    }));
                }
            },

            removeExtraction: (id: string) => {
                set(state => ({ extractions: state.extractions.filter(e => e.id !== id) }));
            },

            clearCompleted: () => {
                set(state => ({
                    extractions: state.extractions.filter(e => e.status !== 'completed' && e.status !== 'failed')
                }));
            },

            getExtraction: (id: string) => get().extractions.find(e => e.id === id),

            processQueue: async () => {
                const { isProcessing, extractions } = get();
                if (isProcessing) return;
                const pending = extractions.filter(e => e.status === 'pending');
                if (pending.length === 0) return;
                set({ isProcessing: true });
                for (const extraction of pending) {
                    await get().startExtraction(extraction.id);
                }
                set({ isProcessing: false });
            },
        }),
        {
            name: 'wow-extractions',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ extractions: state.extractions }),
        }
    )
);
