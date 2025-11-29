import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event } from "../types/place";

interface EventsState {
  events: Event[];
  addEvent: (event: Event) => void;
  toggleAttendance: (eventId: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  getUpcomingEvents: () => Event[];
}

// Mock events data
const MOCK_EVENTS: Event[] = [
  {
    id: "e1",
    name: "Coffee Tasting Workshop",
    description: "Learn about different coffee beans and brewing methods from our expert baristas.",
    placeId: "1",
    placeName: "Coffee Haven",
    date: new Date(2025, 11, 5),
    time: "3:00 PM",
    attendees: 12,
    maxAttendees: 20,
    isUserAttending: false,
    images: ["https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800"],
    tags: ["workshop", "coffee", "learning"],
  },
  {
    id: "e2",
    name: "Networking Night",
    description: "Connect with fellow remote workers and entrepreneurs in a casual setting.",
    placeId: "2",
    placeName: "The Cowork Space",
    date: new Date(2025, 11, 8),
    time: "6:00 PM",
    attendees: 34,
    maxAttendees: 50,
    isUserAttending: false,
    images: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"],
    tags: ["networking", "professional", "social"],
  },
  {
    id: "e3",
    name: "Live Jazz Night",
    description: "Enjoy live jazz performances while sipping on craft cocktails.",
    placeId: "4",
    placeName: "Sunset Lounge",
    date: new Date(2025, 11, 10),
    time: "8:00 PM",
    attendees: 45,
    isUserAttending: false,
    images: ["https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800"],
    tags: ["music", "entertainment", "nightlife"],
  },
];

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: MOCK_EVENTS,

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      toggleAttendance: (eventId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  isUserAttending: !event.isUserAttending,
                  attendees: event.isUserAttending
                    ? event.attendees - 1
                    : event.attendees + 1,
                }
              : event
          ),
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        })),

      getUpcomingEvents: () => {
        const { events } = get();
        const now = new Date();
        return events
          .filter((event) => new Date(event.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },
    }),
    {
      name: "events-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
