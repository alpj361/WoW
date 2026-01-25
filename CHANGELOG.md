# Changelog

All notable changes to the WOW Events project will be documented in this file.

## [0.0.10] - 2026-01-24

### Fixed
- 🔄 **Auth Loop & Timeout**: Fixed infinite redirect loop caused by strict 5s profile fetch timeout
  - **Persistence**: Implemented `AsyncStorage` caching for instant profile load
  - **Timeout**: Increased background fetch timeout to 20s to allow updates on slow networks
  - **Fallback**: Added robust fallback-to-cache logic in `onAuthStateChange` to prevent unnecessary logouts
  - **Stability**: Prevents "Profile fetch timeout" error from clearing valid user sessions

- 🐛 **Syntax Error**: Fixed invalid `else if` block in `AuthContext.tsx`
- 🐛 **Corrupted File**: clean up accidental logs in `app/index.tsx`

### Improved
- 💳 **Payment UX**: Added pre-payment alert modal for paid events to prevent confusion
- ⚡ **Performance**: Application now loads instantly for returning users via cache

### Technical Details
```
Modified:
- frontend/src/context/AuthContext.tsx (caching, timeout increase, error handling)
- frontend/app/index.tsx (payment alert, log cleanup)
```

## [0.0.9] - 2026-01-24

### Fixed
- 🔐 **Session Persistence Issues**: Resolved critical session management problems
  - **Storage**: Now uses `localStorage` directly on web instead of AsyncStorage wrapper for more reliable persistence
  - **Token Refresh**: Profile is now re-fetched on every token refresh to ensure consistency
  - **Race Conditions**: Added `isInitializing` ref to prevent duplicate initializations in React Strict Mode
  - **Timeouts**: Increased auth loading timeout from 10s to 30s to accommodate slower networks
  - **Profile Fetch**: Optimized with 5s timeout per attempt and faster retry logic (500ms delay, 2 attempts max)
  - **Auto-Recovery**: Added `visibilitychange` listener to re-validate session when user returns to page
  - Sessions now persist correctly between page reloads without unexpected logouts

- 🐛 **ActivityIndicator Import**: Fixed `ReferenceError: ActivityIndicator is not defined` in `myevents.tsx`
  - Added missing `ActivityIndicator` import from `react-native`

- 🐛 **Attendees Endpoint Error**: Fixed 500 Internal Server Error in backend
  - Rewrote `/api/events/:eventId/attendees` endpoint with proper Supabase query syntax
  - Split into two queries: fetch saved_events, then fetch profiles separately
  - Added proper error handling and logging

- 📊 **TypeScript Errors**: Fixed missing type definitions in `eventStore.ts`
  - Added `HostedEventData` interface export
  - Added missing method signatures: `fetchHostedEvents()`, `fetchEventAttendees()`, `createEvent()`

### Changed
- ⚡ **Auth Performance**: Faster profile loading with optimized timeout and retry logic
- 🔄 **Session Validation**: More robust session state management with automatic recovery

### Technical Details
```
Modified:
- frontend/src/services/supabase.ts (localStorage for web, AsyncStorage for native)
- frontend/src/context/AuthContext.tsx (token refresh handling, auto-recovery, race condition prevention)
- frontend/app/_layout.tsx (increased timeout to 30s)
- frontend/app/myevents.tsx (ActivityIndicator import)
- frontend/src/store/eventStore.ts (added HostedEventData type, method signatures)
```

## [0.0.8] - 2026-01-24

### Added
- 🎉 **Host Feature**: Complete implementation of Event Hosting ("Anfitrión")
  - **Create**: Toggle "Soy el Anfitrión" in `create.tsx` to host events
  - **My Events**: New "Anfitrión" tab in `myevents.tsx`
  - **Attendees**: View list of interested users with date and profile info
  - **Backend**: New endpoints for hosted events and attendees
  - **State**: Updated `eventStore` and `api` services

### Fixed
- 🐛 **Backend Route Shadowing**: Moved `GET /hosted/:userId` before `GET /:id` in `events.js` to fix 404 errors
- 🐛 **Frontend Blank Screen**: Fixed syntax error (premature closure) in `myevents.tsx`
- 🐛 **API Exports**: Fixed missing exports/imports for `fetchHostedEvents`

### Technical Details
- Synchronized versioning with Frontend to 0.0.8
- Backend endpoints: `/api/events/hosted/:userId`, `/api/events/:eventId/attendees`

## [0.0.7] - 2026-01-24

### Added
- 📱 **Código QR en Perfil**: Nueva funcionalidad para compartir perfil via QR
  - Toggle **ECARD | ESCANEAR** en la sección de tarjeta digital
  - Animación de deslizamiento suave entre tarjeta y QR (`Animated.spring`)
  - Código QR contiene: `wow://user/{user_id}`
  - Diseño minimalista con gradiente oscuro
  - Responsive: usa `onLayout` para calcular ancho dinámicamente (funciona en web y móvil)
  - Librería: `react-native-qrcode-svg`

- 📄 **Pantalla de Detalle de Evento**: Nueva ruta `/event/[id]`
  - Vista completa de información del evento
  - Imagen del evento o gradiente de categoría como fallback
  - Título, descripción, fecha/hora, ubicación
  - Badge de categoría con color
  - Acciones: guardar, marcar asistido, calificar con emoji
  - Botón de regreso y navegación desde cards

### Fixed
- 🔐 **Roles de Usuario en Auth**: Actualizado constraint para permitir `alpha`/`beta` (minúsculas y mayúsculas)
  - Valores permitidos: `user`, `organizer`, `admin`, `Beta`, `Alpha`, `alpha`, `beta`
- 🐛 **DigitalCard Syntax Error**: Corregido "Missing initializer in const declaration" en `useImperativeHandle`

### Technical Details
```
Modified:
- frontend/app/profile.tsx (QR tabs, slider, QR card)
- frontend/src/components/DigitalCard.tsx (syntax fix)
- frontend/package.json (react-native-qrcode-svg)

Created:
- frontend/app/event/[id].tsx (event detail screen)
- docs/PLAN-HOST-FEATURE.md (plan for future host feature)

Database Migrations:
- add_beta_alpha_roles
- fix_alpha_lowercase_role
```

---

## [0.0.6] - 2026-01-23

### Added
- 🔗 **"Desde URL" Feature**: Create events from Instagram posts
  - New "Desde URL" button in image upload section
  - Modal to paste Instagram post URL
  - Automatic image extraction from Instagram
  - AI analysis of extracted flyer image
  - Auto-fill form fields (title, description, date, time, location)
- 📡 **API Function**: `analyzeUrl()` in `api.ts`
  - Calls backend `/api/events/analyze-url`
  - Returns `UrlAnalysisResult` with extracted image URL and analysis

### Changed
- 🎨 **Upload Options**: Now shows 3 buttons (Camera, Gallery, URL)
- 📦 **Import**: Added `analyzeUrl` to api.ts imports in create.tsx

### Technical Details
```
Modified:
- frontend/src/services/api.ts (analyzeUrl function + UrlAnalysisResult interface)
- frontend/app/create.tsx (URL modal, state, handler, button)

Bugs presented when adding URL feature.

## [0.0.5] - 2026-01-22

### Added
- 🗄️ **Database Tables for User Events**:
  - `saved_events` - Stores events saved by users
  - `attended_events` - Stores events attended by users with emoji ratings
- 🔒 **Row Level Security (RLS)**: Each user can only view/modify their own events
- 📊 **eventStore Functions**:
  - `fetchSavedEvents()` → Obtains from Supabase with join to events
  - `fetchAttendedEvents()` → Obtains from Supabase with join to events
  - `saveEvent()` / `unsaveEvent()` → Manage saved_events
  - `markAttended()` / `removeAttended()` → Manage attended_events

### Fixed
- 🐛 **Supabase Build Error**: Fixed `supabaseUrl is required` error on Vercel by using placeholder client when env vars not configured
- 🔄 **Auth Flow Race Conditions**: Fixed black screens and redirect loops during login/register
- 🔐 **Auth State Management**: Added `authState` utility to coordinate auth-callback with layout

### Changed
- 🔄 **Event Persistence**: Saved and attended events now persist per-user in database
- 📦 **Auth Callback**: Improved handling of login vs registration flow
- 🏗️ **Layout Navigation**: Better detection of auth processing state

## [0.0.4] - 2026-01-21

### Added
- 🔐 **Google Authentication**: Login with Google + invitation codes
- 🎬 **Splash Video**: Animated splash screen while loading

### Changed
- 🔀 **App Layout**: Now wraps in `AuthProvider` with auth gating
- 🏠 **Navigation**: After event creation redirects to Home (not My Events)

## [0.0.3] - 2026-01-20

### Added
- ✨ **Supabase Integration**: Backend now uses Supabase for event storage
- 📡 **API Service**: New `api.ts` service for backend communication
- 🤖 **AI Image Analysis**: Added "Analyze Flyer" button to auto-fill event details
- 📋 **Agent Workflows**: Added `/changelog` and `/rules` workflows

### Changed
- 🔄 **Event Store**: Replaced mock data with real API calls
- 🗄️ **Backend Database**: Switched from MongoDB to Supabase

### Removed
- 🗑️ **Mock Data**: Removed `SAMPLE_EVENTS` from `eventStore.ts`

## [0.0.2] - 2026-01-19

### Added
- ✨ **Vercel Deployment Configuration**: Added `vercel.json` with proper build settings
- 📝 **Deployment Guide**: Created comprehensive `DEPLOYMENT.md` with troubleshooting
- 🔨 **Build Script**: Added `build:web` npm script for production builds

### Changed
- 📚 **README**: Added deployment section with Vercel instructions
- 📦 **package.json**: Added production build script

### Fixed
- 🐛 **404 Error on Vercel**: Configured rewrites to properly serve SPA routes

## [0.0.1] - 2026-01-19

### Added
- ✨ **Web Viewport Simulation**: Added `WebViewport.tsx` component that simulates a mobile device viewport (390x844px) when running on web
- 📱 **Mock Data System**: Implemented 10 pre-loaded sample events in `eventStore.ts` for demo purposes (temporary until backend integration)
- 🎯 **Hybrid Swipe System**: Platform-aware swipe implementation that uses touch gestures on mobile and button actions on web
- 🎨 **Optimized Card Layout**: Reduced card height to 25% of screen height for better content visibility
- 📝 **Comprehensive Documentation**: Created detailed README.md with architecture, setup instructions, and feature overview
- 🔧 **.env Configuration**: Added environment file for future backend URL configuration

### Changed
- 🎨 **EventCard Optimization**:
  - Reduced card height from 60% to 25% of viewport height
  - Optimized padding and spacing (12px from 14px)
  - Reduced font sizes for better fit (title: 18px, description: 11px)
  - Adjusted icon sizes (category badge: 10px, action buttons: 24px)
  - Added gradient overlay for better text readability
  - Improved button spacing (gap: 32px, marginTop: 12px)

- 📐 **Layout Improvements**:
  - Header logo reduced to 32px (from 36px)
  - Tagline reduced to 12px (from 14px)
  - Category icons reduced to 48px (from 52px)
  - Category labels reduced to 11px (from 12px)
  - Optimized vertical spacing across all components
  - Cards now use `justifyContent: 'flex-start'` for better positioning

- 🔄 **State Management**:
  - Modified `eventStore.ts` to load mock data immediately on initialization
  - Removed backend API calls (axios dependencies) for demo mode
  - Added simulated API delays (300ms) for realistic UX
  - All CRUD operations now work with local state

### Fixed
- 🐛 **Content Visibility**: Fixed issue where event description and action buttons were cut off or not visible
- 🐛 **Web Compatibility**: Resolved gesture handler incompatibility on web by implementing platform-specific rendering
- 🐛 **Button Clickability**: Added proper z-index values to ensure action buttons are always clickable
- 🐛 **Overflow Issues**: Removed problematic `overflow: 'hidden'` from WebViewport that was cutting content

### Technical Details

#### File Changes
```
Modified:
- frontend/src/store/eventStore.ts (Mock data implementation)
- frontend/src/components/EventCard.tsx (Layout optimization)
- frontend/src/components/CategoryFilter.tsx (Size reduction)
- frontend/app/index.tsx (Hybrid swipe system)
- frontend/app/_layout.tsx (WebViewport integration)
- README.md (Complete documentation)

Created:
- frontend/src/components/WebViewport.tsx (Web viewport simulator)
- frontend/.env (Environment configuration)
- CHANGELOG.md (This file)
```

#### Dependencies
- No new dependencies added
- Existing dependencies: All managed via `npm install --legacy-peer-deps`

#### Platform Support
- ✅ iOS: Native gestures + full animations
- ✅ Android: Native gestures + full animations
- ✅ Web: Button-based navigation + visual animations

### Notes

> **Mock Data**: The current implementation uses hardcoded event data located in `frontend/src/store/eventStore.ts`. This is **temporary** and will be replaced with real backend API calls when the FastAPI + MongoDB integration is completed.

### Breaking Changes
None. This is the initial documented release.

---

## Future Releases

### [0.1.0] - Planned
- Backend integration with FastAPI
- Real-time event updates
- User authentication
- Event creation UI
- Image upload functionality
- Push notifications

### [0.2.0] - Planned
- Social features (comments, sharing)
- Event recommendations based on user preferences
- Map view for event locations
- Calendar integration
