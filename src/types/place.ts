export type PlaceCategory =
  | "coworking"
  | "restaurant"
  | "bar"
  | "coffee"
  | "event";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  hours?: string;
  contact?: string;
  images: string[];
  rating?: number;
  priceLevel?: "$" | "$$" | "$$$";
  features?: string[];
  artisticIllustration?: string; // URL to hand-drawn style illustration
  primaryColor?: string; // Brand color for this place
  createdBy?: string;
  checkInCount?: number;
  isFavorite?: boolean;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  placeId: string;
  placeName: string;
  date: Date;
  time: string;
  attendees: number;
  maxAttendees?: number;
  isUserAttending?: boolean;
  images: string[];
  tags?: string[];
}

export interface CheckIn {
  id: string;
  placeId: string;
  placeName: string;
  timestamp: Date;
  note?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  checkIns: CheckIn[];
  favorites: string[]; // place IDs
  createdPlaces: string[]; // place IDs
}
