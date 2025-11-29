# Collaborative Map Space

A beautiful mobile app for discovering and sharing places like coffee shops, coworking spaces, restaurants, bars, and events. Built with React Native, Expo, and inspired by modern iOS design.

## Features

### 🗺️ Discover Places
- Browse places with stunning, artistic card-based UI
- Filter by category: Coffee, Coworking, Restaurants, Bars
- View detailed information, photos, ratings, and check-ins
- Save favorite places for quick access
- Check in at locations to track your adventures

### 🗺️ Interactive Map
- Real-time map view with custom markers
- Location-based discovery
- Color-coded markers by category
- Easy navigation to place details
- Add new places directly from the map

### 📅 Events
- Browse upcoming events at your favorite places
- Create and host events at locations
- RSVP and track attendance
- View event details, dates, and locations
- Discover community gatherings

### 👤 Profile
- Track your check-in history
- View all your favorite places
- See places you've contributed
- Personal activity timeline
- User statistics and achievements

### ➕ Contribute
- Add new places to the community map
- Create events at existing locations
- Share discoveries with others
- Help build the collaborative space

## Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand with AsyncStorage persistence
- **Maps**: React Native Maps
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Animations**: React Native Reanimated v3
- **UI Components**: Custom components with iOS-native feel

## Project Structure

```
src/
├── screens/           # Main app screens
│   ├── DiscoverScreen.tsx    # Browse places with cards
│   ├── MapScreen.tsx          # Interactive map view
│   ├── EventsScreen.tsx       # Events listing
│   ├── ProfileScreen.tsx      # User profile
│   ├── PlaceDetailScreen.tsx  # Place details modal
│   ├── AddPlaceScreen.tsx     # Add new place form
│   └── CreateEventScreen.tsx  # Create event form
├── navigation/        # Navigation setup
│   └── RootNavigator.tsx
├── state/            # Zustand stores
│   ├── placesStore.ts         # Places data & actions
│   ├── eventsStore.ts         # Events data & actions
│   └── userStore.ts           # User profile & favorites
├── types/            # TypeScript definitions
│   └── place.ts               # Place, Event, User types
└── components/       # Reusable components
```

## Design Philosophy

The app follows Apple's Human Interface Design guidelines with:
- Clean, modern aesthetics
- Bold colors and artistic illustrations
- Card-based layouts for content
- Smooth animations and transitions
- Native iOS gestures and interactions
- Beautiful gradients and overlays
- Micro-interactions with haptic feedback

## Key Features Implementation

### State Management
- **Places Store**: Manages all location data, categories, favorites
- **Events Store**: Handles event creation, attendance, filtering
- **User Store**: Tracks check-ins, favorites, user profile
- All stores persist data with AsyncStorage for offline access

### Navigation Flow
- Bottom tabs for main sections (Discover, Map, Events, Profile)
- Modal presentation for place details
- Form sheets for adding places and creating events
- Smooth transitions between screens

### Animations
- Parallax scrolling on place cards
- Animated headers that appear on scroll
- Smooth page transitions
- Button press animations with haptic feedback
- Card hover effects

## Mock Data

The app includes rich mock data for:
- 5 diverse places across different categories
- 3 upcoming events with full details
- User profile with sample check-ins
- High-quality placeholder images from Unsplash

## Future Enhancements

Potential features to add:
- Real-time location tracking
- Social features (following, activity feed)
- Photo uploads for places
- Reviews and ratings system
- Search and advanced filtering
- Push notifications for events
- Integration with real mapping APIs
- User authentication
- Backend API integration
