import { create } from 'zustand';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PuntoReferencia {
    lugar: string;
    hora: string;
}

export interface ProcesionDB {
    id: string;
    holiday_id: string | null;
    nombre: string;
    iglesia: string | null;   // Nombre del templo/parroquia
    fecha: string;            // ISO date "2026-02-17"
    hora_salida: string | null;
    hora_entrada: string | null;
    lugar_salida: string | null;
    puntos_referencia: PuntoReferencia[];
    imagenes_procesion: string[];
    imagenes_recorrido: string[];
    source_url: string | null;
    created_at: string;
    tipo_procesion: string | null;
    live_tracking_url: string | null;
    recorrido_maps_url: string | null;
    facebook_url: string | null;
    ciudad: string | null;
    // Optional computed fields for compatibility
    horarios?: {
        salida: string;
        entrada: string;
    };
}

export const buildGoogleMapsUrl = (puntos: PuntoReferencia[]): string | null => {
    if (!puntos || puntos.length === 0) return null;

    if (puntos.length === 1) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puntos[0].lugar)}`;
    }

    const origin = encodeURIComponent(puntos[0].lugar);
    const destination = encodeURIComponent(puntos[puntos.length - 1].lugar);

    if (puntos.length === 2) {
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    }

    const waypoints = puntos
        .slice(1, puntos.length - 1)
        .map(p => encodeURIComponent(p.lugar))
        .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
};

export const mapDBToProcesion = (db: ProcesionDB): any => {
    return {
        nombre_procesion: db.nombre,
        fecha: formatDBDate(db.fecha), // Helpers to format YYYY-MM-DD -> "17 de febrero 2026"
        puntos_referencia: db.puntos_referencia || [],
        imagenes_recorrido: (db.imagenes_recorrido || []).map(url => ({ value: url })),
        imagenes_procesion: db.imagenes_procesion || [],
        horarios: {
            salida: db.hora_salida || 'Por confirmar',
            entrada: db.hora_entrada || 'Por confirmar',
        },
        tipo_procesion: db.tipo_procesion || null,
    };
};

const formatDBDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} ${year}`;
};

export const isProcessionLive = (proc: ProcesionDB): boolean => {
    if (!proc.hora_salida || !proc.hora_entrada) return false;

    // Manual parse to ensure local time consistency
    const [y, m, d] = proc.fecha.split('-').map(Number);
    const [sh, sm] = proc.hora_salida.split(':').map(Number);
    const [eh, em] = proc.hora_entrada.split(':').map(Number);

    const start = new Date(y, m - 1, d, sh, sm);
    let end = new Date(y, m - 1, d, eh, em);

    // Handle overnight processions (end time < start time)
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    const now = new Date();
    return now >= start && now <= end;
};

export interface ProcesionStore {
    procesiones: ProcesionDB[];
    savedProcesionIds: Set<string>;
    savedProcesiones: ProcesionDB[];
    cargandoTurnos: Record<string, number>;
    isLoading: boolean;
    error: string | null;
    selectedCiudad: 'Ciudad de Guatemala' | 'Antigua Guatemala' | null;

    fetchProcesiones: (holidaySlug?: string) => Promise<void>;
    fetchSavedProcesiones: () => Promise<void>;
    toggleSaveProcesion: (procesionId: string) => Promise<void>;
    unsaveProcesion: (procesionId: string) => Promise<void>;
    isSaved: (procesionId: string) => boolean;
    fetchCargandoTurnos: () => Promise<void>;
    cargarTurno: (procesionId: string, turnoNumber: number) => Promise<void>;
    descargarTurno: (procesionId: string) => Promise<void>;
    getTurno: (procesionId: string) => number | undefined;
    setSelectedCiudad: (ciudad: 'Ciudad de Guatemala' | 'Antigua Guatemala' | null) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────────

export const useProcesionStore = create<ProcesionStore>((set, get) => ({
    procesiones: [],
    savedProcesionIds: new Set(),
    savedProcesiones: [],
    cargandoTurnos: {},
    isLoading: false,
    error: null,
    selectedCiudad: null,

    fetchProcesiones: async (holidaySlug?: string) => {
        set({ isLoading: true, error: null });
        try {
            const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
            const { selectedCiudad } = get();

            let query = supabase
                .from('procesiones')
                .select('*')
                .gte('fecha', today)
                .order('fecha', { ascending: true })
                .order('hora_salida', { ascending: true });

            if (holidaySlug) {
                // Join through holidays to filter by slug
                const { data: holiday } = await supabase
                    .from('holidays')
                    .select('id')
                    .eq('slug', holidaySlug)
                    .single();

                if (holiday) {
                    query = query.eq('holiday_id', holiday.id);
                }
            }

            // Filter by ciudad if selected
            if (selectedCiudad) {
                query = query.eq('ciudad', selectedCiudad);
            }

            const { data, error } = await query;
            if (error) throw error;

            set({
                procesiones: (data || []) as ProcesionDB[],
                isLoading: false,
            });
        } catch (error: any) {
            console.error('[ProcesionStore] Error fetching procesiones:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    fetchSavedProcesiones: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ savedProcesionIds: new Set(), savedProcesiones: [] });
                return;
            }

            // Fetch saved procession IDs
            const { data: savedData, error: savedError } = await supabase
                .from('saved_procesiones')
                .select('procesion_id')
                .eq('user_id', user.id);

            if (savedError) throw savedError;

            const ids = (savedData || []).map((d: any) => d.procesion_id);
            const idSet = new Set(ids);

            if (ids.length === 0) {
                set({ savedProcesionIds: idSet, savedProcesiones: [] });
                return;
            }

            // Fetch full procession details for saved ones
            const { data: procData, error: procError } = await supabase
                .from('procesiones')
                .select('*')
                .in('id', ids)
                .order('fecha', { ascending: true });

            if (procError) throw procError;

            set({
                savedProcesionIds: idSet,
                savedProcesiones: (procData || []) as ProcesionDB[],
            });
        } catch (error: any) {
            console.error('[ProcesionStore] Error fetching saved procesiones:', error);
        }
    },

    toggleSaveProcesion: async (procesionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const isSaved = get().savedProcesionIds.has(procesionId);

            if (isSaved) {
                // Unsave
                const { error } = await supabase
                    .from('saved_procesiones')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('procesion_id', procesionId);

                if (error) throw error;

                set(state => {
                    const next = new Set(state.savedProcesionIds);
                    next.delete(procesionId);
                    return {
                        savedProcesionIds: next,
                        savedProcesiones: state.savedProcesiones.filter(p => p.id !== procesionId),
                    };
                });
            } else {
                // Save
                const { error } = await supabase
                    .from('saved_procesiones')
                    .insert({
                        user_id: user.id,
                        procesion_id: procesionId,
                    });

                if (error) throw error;

                // Add the full procession data to savedProcesiones
                const proc = get().procesiones.find(p => p.id === procesionId);

                set(state => {
                    const next = new Set(state.savedProcesionIds);
                    next.add(procesionId);
                    return {
                        savedProcesionIds: next,
                        savedProcesiones: proc
                            ? [...state.savedProcesiones, proc]
                            : state.savedProcesiones,
                    };
                });
            }
        } catch (error: any) {
            console.error('[ProcesionStore] Error toggling save:', error);
            throw error;
        }
    },

    unsaveProcesion: async (procesionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const { error } = await supabase
                .from('saved_procesiones')
                .delete()
                .eq('user_id', user.id)
                .eq('procesion_id', procesionId);

            if (error) throw error;

            set(state => {
                const next = new Set(state.savedProcesionIds);
                next.delete(procesionId);
                return {
                    savedProcesionIds: next,
                    savedProcesiones: state.savedProcesiones.filter(p => p.id !== procesionId),
                };
            });
        } catch (error: any) {
            console.error('[ProcesionStore] Error unsaving procesion:', error);
            throw error;
        }
    },

    isSaved: (procesionId: string) => {
        return get().savedProcesionIds.has(procesionId);
    },

    fetchCargandoTurnos: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ cargandoTurnos: {} });
                return;
            }

            const { data, error } = await supabase
                .from('procession_cargadores')
                .select('procesion_id, numero_turno')
                .eq('user_id', user.id);

            if (error) throw error;

            const turnos: Record<string, number> = {};
            (data || []).forEach((d: any) => {
                turnos[d.procesion_id] = d.numero_turno;
            });
            set({ cargandoTurnos: turnos });
        } catch (error: any) {
            console.error('[ProcesionStore] Error fetching cargando turnos:', error);
        }
    },

    cargarTurno: async (procesionId: string, turnoNumber: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const { error } = await supabase
                .from('procession_cargadores')
                .upsert(
                    { user_id: user.id, procesion_id: procesionId, numero_turno: turnoNumber },
                    { onConflict: 'user_id,procesion_id' }
                );

            if (error) throw error;

            set(state => {
                return {
                    cargandoTurnos: {
                        ...state.cargandoTurnos,
                        [procesionId]: turnoNumber,
                    }
                };
            });
        } catch (error: any) {
            console.error('[ProcesionStore] Error saving turno:', error);
            throw error;
        }
    },

    descargarTurno: async (procesionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const { error } = await supabase
                .from('procession_cargadores')
                .delete()
                .eq('user_id', user.id)
                .eq('procesion_id', procesionId);

            if (error) throw error;

            set(state => {
                const next = { ...state.cargandoTurnos };
                delete next[procesionId];
                return { cargandoTurnos: next };
            });
        } catch (error: any) {
            console.error('[ProcesionStore] Error removing turno:', error);
            throw error;
        }
    },

    getTurno: (procesionId: string) => {
        return get().cargandoTurnos[procesionId];
    },

    setSelectedCiudad: (ciudad: 'Ciudad de Guatemala' | 'Antigua Guatemala' | null) => {
        set({ selectedCiudad: ciudad });
        // Re-fetch procesiones with new filter
        get().fetchProcesiones('cuaresma-2026');
    },
}));
