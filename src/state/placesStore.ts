import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Place, PlaceCategory } from "../types/place";

interface PlacesState {
  places: Place[];
  selectedCategory: PlaceCategory | "all";
  addPlace: (place: Place) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  toggleFavorite: (placeId: string) => void;
  setSelectedCategory: (category: PlaceCategory | "all") => void;
  getPlacesByCategory: (category: PlaceCategory | "all") => Place[];
  incrementCheckIn: (placeId: string) => void;
}

// Mock data with artistic style
const MOCK_PLACES: Place[] = [
  {
    id: "1",
    name: "Coffee Haven",
    category: "coffee",
    description: "Your escape into Brew Bliss. Artisanal coffee and cozy atmosphere.",
    address: "56 Cooper Street, Bronx, NY 10453",
    latitude: 40.7128,
    longitude: -73.9352,
    hours: "7 AM - 8 PM",
    contact: "(555) 123-4567",
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800"],
    rating: 4.8,
    priceLevel: "$$",
    features: ["Coffee", "Milkshakes", "Desserts"],
    primaryColor: "#4F46E5",
    checkInCount: 234,
    isFavorite: false,
  },
  {
    id: "2",
    name: "The Cowork Space",
    category: "coworking",
    description: "Modern coworking with high-speed internet and great coffee.",
    address: "123 Broadway, New York, NY 10001",
    latitude: 40.7489,
    longitude: -73.9680,
    hours: "24/7",
    contact: "(555) 234-5678",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
    rating: 4.6,
    priceLevel: "$$$",
    features: ["WiFi", "Meeting Rooms", "Coffee Bar", "Printing"],
    primaryColor: "#10B981",
    checkInCount: 456,
    isFavorite: false,
  },
  {
    id: "3",
    name: "La Trattoria",
    category: "restaurant",
    description: "Authentic Italian cuisine in the heart of the city.",
    address: "89 Mulberry Street, New York, NY 10013",
    latitude: 40.7184,
    longitude: -73.9977,
    hours: "11 AM - 11 PM",
    contact: "(555) 345-6789",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"],
    rating: 4.9,
    priceLevel: "$$$",
    features: ["Italian", "Wine Bar", "Outdoor Seating"],
    primaryColor: "#EF4444",
    checkInCount: 789,
    isFavorite: false,
  },
  {
    id: "4",
    name: "Sunset Lounge",
    category: "bar",
    description: "Rooftop bar with stunning city views and craft cocktails.",
    address: "456 Park Avenue, New York, NY 10022",
    latitude: 40.7614,
    longitude: -73.9776,
    hours: "5 PM - 2 AM",
    contact: "(555) 456-7890",
    images: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"],
    rating: 4.7,
    priceLevel: "$$$",
    features: ["Cocktails", "Live Music", "Rooftop"],
    primaryColor: "#F59E0B",
    checkInCount: 567,
    isFavorite: false,
  },
  {
    id: "5",
    name: "Bean & Books",
    category: "coffee",
    description: "A cozy spot where coffee meets literature.",
    address: "234 Amsterdam Avenue, New York, NY 10024",
    latitude: 40.7829,
    longitude: -73.9762,
    hours: "6 AM - 9 PM",
    contact: "(555) 567-8901",
    images: ["https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800"],
    rating: 4.5,
    priceLevel: "$",
    features: ["Books", "Coffee", "Pastries", "Quiet Space"],
    primaryColor: "#8B5CF6",
    checkInCount: 345,
    isFavorite: false,
  },
];

export const usePlacesStore = create<PlacesState>()(
  persist(
    (set, get) => ({
      places: MOCK_PLACES,
      selectedCategory: "all",

      addPlace: (place) =>
        set((state) => ({
          places: [...state.places, place],
        })),

      updatePlace: (id, updates) =>
        set((state) => ({
          places: state.places.map((place) =>
            place.id === id ? { ...place, ...updates } : place
          ),
        })),

      toggleFavorite: (placeId) =>
        set((state) => ({
          places: state.places.map((place) =>
            place.id === placeId
              ? { ...place, isFavorite: !place.isFavorite }
              : place
          ),
        })),

      setSelectedCategory: (category) =>
        set({ selectedCategory: category }),

      getPlacesByCategory: (category) => {
        const { places } = get();
        if (category === "all") return places;
        return places.filter((place) => place.category === category);
      },

      incrementCheckIn: (placeId) =>
        set((state) => ({
          places: state.places.map((place) =>
            place.id === placeId
              ? { ...place, checkInCount: (place.checkInCount || 0) + 1 }
              : place
          ),
        })),
    }),
    {
      name: "places-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
