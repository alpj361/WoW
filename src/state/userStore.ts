import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckIn, UserProfile } from "../types/place";

interface UserState {
  profile: UserProfile;
  addCheckIn: (checkIn: CheckIn) => void;
  addFavorite: (placeId: string) => void;
  removeFavorite: (placeId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: "user1",
  name: "Anna Wilson",
  email: "anna.wilson@example.com",
  checkIns: [],
  favorites: [],
  createdPlaces: [],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,

      addCheckIn: (checkIn) =>
        set((state) => ({
          profile: {
            ...state.profile,
            checkIns: [checkIn, ...state.profile.checkIns],
          },
        })),

      addFavorite: (placeId) =>
        set((state) => ({
          profile: {
            ...state.profile,
            favorites: [...state.profile.favorites, placeId],
          },
        })),

      removeFavorite: (placeId) =>
        set((state) => ({
          profile: {
            ...state.profile,
            favorites: state.profile.favorites.filter((id) => id !== placeId),
          },
        })),

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
