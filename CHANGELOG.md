# Changelog

All notable changes to the WOW Events project will be documented in this file.

## [0.0.3] - 2026-01-21

### Added
- ✨ **Supabase Integration**: Backend now uses Supabase for event storage
- 📡 **API Service**: New `api.ts` service for backend communication
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
