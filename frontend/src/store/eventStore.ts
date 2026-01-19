import { create } from 'zustand';

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

// Mock data - No backend required for demo
const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Noche de Jazz en Vivo',
    description: 'Disfruta de una noche inolvidable con los mejores músicos de jazz de la ciudad. Incluye copa de bienvenida.',
    category: 'music',
    image: null,
    date: '2025-07-20',
    time: '21:00',
    location: 'Jazz Bar La Cava',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Festival de Rock Underground',
    description: 'Las mejores bandas emergentes de rock alternativo. ¡No te lo pierdas!',
    category: 'music',
    image: null,
    date: '2025-07-25',
    time: '18:00',
    location: 'Arena Norte',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Concierto Sinfónico',
    description: 'La orquesta filarmónica presenta obras clásicas de Mozart y Beethoven.',
    category: 'music',
    image: null,
    date: '2025-07-28',
    time: '19:30',
    location: 'Teatro Principal',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Limpieza de Playa',
    description: 'Únete a nuestra jornada de limpieza ecológica. Incluye desayuno y camiseta.',
    category: 'volunteer',
    image: null,
    date: '2025-07-22',
    time: '07:00',
    location: 'Playa del Sol',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Reforestación Comunitaria',
    description: 'Planta un árbol y ayuda al medio ambiente. Todas las herramientas incluidas.',
    category: 'volunteer',
    image: null,
    date: '2025-07-26',
    time: '09:00',
    location: 'Bosque Municipal',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Comedor Social',
    description: 'Ayuda a servir comidas a personas necesitadas. Tu tiempo hace la diferencia.',
    category: 'volunteer',
    image: null,
    date: '2025-07-21',
    time: '12:00',
    location: 'Centro Comunitario',
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Food Truck Festival',
    description: 'Los mejores food trucks de la ciudad en un solo lugar. Música en vivo incluida.',
    category: 'general',
    image: null,
    date: '2025-07-24',
    time: '12:00',
    location: 'Parque Central',
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Networking Tech',
    description: 'Conecta con profesionales del mundo tecnológico. Charlas y networking.',
    category: 'general',
    image: null,
    date: '2025-07-23',
    time: '18:30',
    location: 'Hub de Innovación',
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'Mercado Artesanal',
    description: 'Descubre productos únicos hechos a mano por artesanos locales.',
    category: 'general',
    image: null,
    date: '2025-07-27',
    time: '10:00',
    location: 'Plaza Mayor',
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'Clase de Yoga al Aire Libre',
    description: 'Relájate y conecta con tu cuerpo en esta sesión de yoga gratuita.',
    category: 'general',
    image: null,
    date: '2025-07-20',
    time: '08:00',
    location: 'Jardín Botánico',
    created_at: new Date().toISOString(),
  },
];

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
  events: SAMPLE_EVENTS, // Cargar eventos al iniciar
  savedEvents: [],
  attendedEvents: [],
  currentCategory: 'all',
  isLoading: false,
  error: null,

  fetchEvents: async (category?: string) => {
    set({ isLoading: true, error: null });

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const cat = category || get().currentCategory;
      let filteredEvents = SAMPLE_EVENTS;

      if (cat && cat !== 'all') {
        filteredEvents = SAMPLE_EVENTS.filter(e => e.category === cat);
      }

      set({ events: filteredEvents, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching events:', error);
    }
  },

  fetchSavedEvents: async () => {
    set({ isLoading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ isLoading: false });
  },

  fetchAttendedEvents: async () => {
    set({ isLoading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ isLoading: false });
  },

  saveEvent: async (eventId: string) => {
    try {
      const event = SAMPLE_EVENTS.find(e => e.id === eventId);
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
      const event = SAMPLE_EVENTS.find(e => e.id === eventId);
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
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        title: eventData.title || '',
        description: eventData.description || '',
        category: eventData.category || 'general',
        image: eventData.image || null,
        date: eventData.date || null,
        time: eventData.time || null,
        location: eventData.location || null,
        created_at: new Date().toISOString(),
      };

      SAMPLE_EVENTS.unshift(newEvent);
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

  seedData: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      get().fetchEvents();
    } catch (error: any) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
}));
