# WoW Frontend

Mobile app for discovering and experiencing local events. Built with React Native and Expo.

## Features

- 🎯 **Event Discovery**: Swipe through events like a dating app
- 📸 **AI Image Analysis**: Upload event flyers, AI extracts details
- 🔐 **Google Authentication**: Login with Google + invitation codes
- 📱 **Cross-platform**: iOS, Android, and Web support

## Tech Stack

- **Framework**: React Native + Expo
- **Routing**: Expo Router (file-based)
- **State**: Zustand
- **Backend**: Supabase + Custom API
- **Auth**: Supabase Auth with Google OAuth

## Project Structure

```
frontend/
├── app/                    # Screens (file-based routing)
│   ├── _layout.tsx        # Root layout with AuthProvider
│   ├── index.tsx          # Home/Explore screen
│   ├── auth.tsx           # Login screen (code + Google)
│   ├── auth-callback.tsx  # OAuth callback handler
│   ├── create.tsx         # Create event form
│   ├── myevents.tsx       # Saved events
│   └── profile.tsx        # User profile
├── src/
│   ├── components/        # Reusable components
│   │   ├── SplashScreen.tsx  # Video splash
│   │   └── ...
│   ├── context/           # React contexts
│   │   └── AuthContext.tsx   # Auth state
│   ├── services/          # API services
│   │   ├── api.ts         # Backend API
│   │   └── supabase.ts    # Supabase client
│   └── store/             # Zustand stores
│       └── eventStore.ts
└── assets/                # Images, videos
    └── splash-video.mp4
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development**
   ```bash
   npx expo start
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## Auth Flow

1. App opens → Shows splash video
2. No session → Redirects to `/auth`
3. User enters invitation code
4. Code valid → Shows Google button
5. Google OAuth → Creates profile
6. Authenticated → Navigate to Home
