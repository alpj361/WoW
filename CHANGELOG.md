# Changelog

All notable changes to the WOW Events project will be documented in this file.

## [0.0.18] - 2026-02-09

### Added
- 🔮 **Glassmorphism UI**: New visual design system with glass effects
  - `expo-blur` dependency for native blur effects
  - `GlassTabBar` component with frosted glass effect using `BlurView`
  - Semi-transparent background with blur, rounded top corners (24px)
  - Purple glow border on top edge
  - Active tab indicator with glow effect
  - Outline/filled icon variants based on active state
  - Web fallback with CSS backdrop-filter

- ✨ **Neon Logo Effect**: Updated `WowLogo` component
  - New gradient: purple → pink → red (`#8B5CF6` → `#D946EF` → `#F43F5E`)
  - 5-layer glow stack for neon effect
  - Configurable `glowIntensity` prop (`'low' | 'medium' | 'high'`)
  - White highlight stroke for extra definition
  - iOS shadow overlay for enhanced glow

- 📥 **Background Extraction System**: Process Instagram URLs while app is in background
  - New `extractions` tab in navigation for managing extractions
  - `extractionStore.ts` (web) and `extractionStore.native.ts` (native) - platform-specific Zustand stores
  - Web version: No persistence (avoids `import.meta` bundling issues)
  - Native version: AsyncStorage persistence for iOS/Android
  - Queue-based processing with automatic retry on app foreground
  - AppState listener to resume processing when app returns to foreground

- 🔄 **AnimatedLoader Component** (`src/components/AnimatedLoader.tsx`)
  - `AnimatedLoader`: 3D purple sphere with glow effects and pulse/rotation animations
  - `InlineLoader`: Bouncing dots for inline status indicators
  - `MiniSphereLoader`: Mini pulsing sphere for thumbnails

- 📋 **Extractions Screen** (`app/extractions.tsx`)
  - List view of all extractions with status indicators
  - Image selector modal for multi-image posts
  - Auto-navigate to create screen with pre-filled data
  - Real-time status updates (pending → extracting → ready → analyzing → completed)

### Fixed
- 🔄 **Flash of Unfiltered Content**: Fixed race condition on initial load
  - Added `await` to `fetchEvents()` in initialization sequence
  - Changed `isInitialized` from `useRef` to `useState` to trigger re-renders
  - Skeleton loader now shows until all data is properly filtered

- ♾️ **Infinite Loading Bug**: Fixed app getting stuck on loading
  - Root cause: `useRef` doesn't trigger re-renders when value changes
  - Solution: Converted `isInitialized` to `useState` for proper reactivity

- 📱 **iOS Loading Stuck on Startup**: App was stuck on loading screen
  - Root cause: `authState.isInitialized` check returned early without setting `loading=false`
  - Added `restoreFromCache()` function in AuthContext

- 🌐 **Web Bundling Error** (`import.meta` SyntaxError)
  - Root cause: `zustand/middleware` uses ESM `import.meta.env`
  - Solution: Platform-specific store files (`.ts` for web, `.native.ts` for native)

### Changed
- 🎨 **Tab Bar**: Replaced default Expo Router tab bar with custom `GlassTabBar`
  - Tab bar now has glassmorphism styling instead of solid dark background
  - Added `extractions` to mainRoutes with cloud-download icon
- 📝 **Create Screen**: Auto-navigates to extractions tab after URL submission

### Technical Details
```
New Files:
- frontend/src/components/GlassTabBar.tsx
- frontend/src/components/AnimatedLoader.tsx
- frontend/src/store/extractionStore.ts (web)
- frontend/src/store/extractionStore.native.ts (native)
- frontend/app/extractions.tsx

Modified:
- frontend/app/_layout.tsx (custom GlassTabBar integration)
- frontend/app/index.tsx (race condition and loading state fixes)
- frontend/src/components/WowLogo.tsx (neon glow effect)

Dependencies Added:
- expo-blur
```

---

## [0.0.17] - 2026-02-09

### Added
- 🖼️ **Multiple Image Selection for Instagram Carousels**: When extracting from Instagram posts with multiple images
  - New image selector modal with horizontal scroll
  - Users can choose which image to use from carousels
  - Shows image count indicator (1/5, 2/5, etc.)
  - Works with both single posts and carousels

### Changed
- ⏱️ **Increased URL Extraction Timeout**: From 30s to 180s (3 minutes)
  - Instagram extraction can take longer due to Playwright/yt-dlp processing
  - Prevents timeout errors on slower connections

### Technical Details
```
Modified:
- frontend/app/create.tsx (image selector modal, handleSelectImage, extractedImages state)
- frontend/src/services/api.ts (increased timeout, added extracted_images to UrlAnalysisResult)
```

---

## [0.0.16] - 2026-02-03

### Added
- 💬 **Event Reactions System**: New thread-style reactions for attended events
  - **Public Reactions Thread**: All attendees can see reactions from other users
  - **User Profiles**: Each reaction displays user's avatar and name
  - **Emoji Reactions**: Quick-select from 10 predefined emojis (😍, 🔥, 👏, 🎉, etc.)
  - **Comments**: Text comments up to 280 characters
  - **One Reaction Per User**: Each user can add/edit one reaction per event
  - **Real-time Updates**: Thread reloads after posting a reaction

### Removed
- ❌ **Like Button**: Removed heart/like button from event details screen
  - Replaced by the new reactions system which is more engaging

### Technical Details
```
Database Migration:
- attended_events.reaction_sticker (TEXT) - For future stickers
- attended_events.reaction_gif (TEXT) - For future GIPHY integration
- attended_events.reaction_comment (TEXT) - User comments

Modified:
- frontend/app/event/[id].tsx (removed like button)
- frontend/app/myevents.tsx (modal integration)
- frontend/src/store/eventStore.ts (new interfaces and functions)
- frontend/src/components/EventReactionsModal.tsx (complete redesign)

New Store Functions:
- fetchPublicReactions(eventId) - Get all reactions for an event
- updateEventReaction(eventId, reaction) - Save/update user reaction
```

### Pending Features
- 🎭 Sticker packs (predefined stickers)
- 🎬 GIPHY integration (requires API key)

---

## [0.0.15] - 2026-02-02

### Fixed
- 🗑️ **Delete Buttons Not Responding**: Fixed event deletion buttons in "Mis Eventos"
  - **Root Cause 1**: `GestureTouchable` inside `Animated.View` caused gesture conflicts → Changed to `Pressable`
  - **Root Cause 2**: `Alert.alert` doesn't work on web platform → Added `window.confirm` fallback for web
  - **Affected Areas**: Saved events, Attended events, and Hosted events deletion
  - **Impact**: Delete icons now work on both native (iOS/Android) and web platforms

---

## [0.0.14] - 2026-01-31

### Added
- 📱 **WhatsApp Integration**: New upload option to send event flyers via WhatsApp
  - Button in event creation screen alongside Camera, Gallery, and URL options
  - Opens WhatsApp with pre-filled message to send flyers
  - Phone number: 50252725024
  - Alert with instructions about image requirements

### Fixed
- 🎨 **UI Gesture Conflicts**: Resolved multiple UI interaction issues
  - **EventCard**: Moved action buttons outside `TouchableOpacity` to prevent gesture conflicts
  - **Skip/Save Animations**: Buttons now properly trigger animations instead of navigating to event details
  - **Image Sizing**: Fixed saved events card images using `position: absolute` with 100% width/height
  - **Gallery Layout**: Attended events now use proper 3-column Letterboxd-style grid with 2:3 aspect ratio
  - **Double Wrapping**: Removed redundant `Animated.View` wrapping from event rendering
- ⚛️ **React Hydration Error #418**: Migrated from old Animated API to react-native-reanimated hooks
  - **Root Cause**: Class-based `Animated.Value` causing "T.default.Value is not a constructor" on web
  - **Solution**: Converted to `useSharedValue`, `useAnimatedStyle`, `withTiming`, and `withRepeat`
  - **Components Updated**: `DigitalCard.tsx`, `profile.tsx`, `auth.tsx`, `myevents.tsx`

### Changed
- 📊 **MyEvents Enhancements**: Improved event management and display
  - Enhanced event store with better state management
  - Improved UI/UX for saved, attended, and hosted events
  - Better error handling and loading states

### Technical Details
```
Modified:
- frontend/app/create.tsx (WhatsApp button integration)
- frontend/app/myevents.tsx (image styles, grid layout, animations)
- frontend/src/components/EventCard.tsx (button positioning, gesture handling)
- frontend/src/components/DigitalCard.tsx (animation migration)
- frontend/app/profile.tsx (animation migration)
- frontend/app/auth.tsx (animation migration)
- frontend/src/store/eventStore.ts (state management improvements)
```

---

## [0.0.13] - 2026-01-27

### Fixed
- 🗑️ **Delete Buttons Not Responding**: Fixed event deletion buttons in "Mis Eventos"
  - **Root Cause**: `GestureTouchable` inside `Animated.View` and `GestureScrollView` caused gesture conflicts
  - **Solution**: Changed to React Native's `Pressable` component with opacity feedback
  - **Affected Areas**: Saved events "Guardados" tab and Hosted events "Anfitrión" tab
  - **Impact**: Delete icons now properly respond to taps and show confirmation dialogs

### Added
- 🖼️ **Visor de Comprobantes de Pago**: Los hosts ahora pueden ver los comprobantes de pago subidos
  - **Modal de Imagen**: Nuevo modal a pantalla completa para visualizar comprobantes
  - **Integración**: Botón "Ver comprobante" en solicitudes de registro
  - **Backend**: El endpoint `/api/events/:eventId/attendance-list` ahora incluye `payment_receipt_url`
  - **Diseño**: Modal oscuro con imagen a tamaño completo y botón de cierre

### Changed
- 📊 **Lista de Asistencia Mejorada**: Ahora incluye información de comprobantes de pago
  - Actualizado `AttendanceListItem` interface con campo `payment_receipt_url` opcional
  - Backend devuelve comprobantes de pago en la lista de asistencia

### Technical Details
```
Modified:
- ../WoWBack/event-analyzer/server/routes/events.js (added payment_receipt_url to query)
- frontend/src/services/api.ts (updated AttendanceListItem interface)
- frontend/app/myevents.tsx (added receipt viewer modal, state, handlers)

New Components:
- Receipt Viewer Modal (receiptModal state)
- Full-screen image display with close button

Styles Added:
- receiptModalOverlay
- receiptModalContent  
- receiptImageContainer
- fullReceiptImage
- closeReceiptButton
- closeReceiptText
```

### User Experience
```
Flow:
1. Host abre solicitudes de registro ✅
2. Ve botón "Ver comprobante" en usuarios con pago ✅
3. Click abre modal a pantalla completa ✅
4. Imagen del comprobante visible en alta resolución ✅
5. Botón "Cerrar" para regresar ✅
```

---

## [0.0.13] - 2026-01-27

### Improved
- 🎯 **Mensajes de Error Específicos en Escaneo QR**: Mejorada la validación de asistencia con mensajes más claros
  - **"Usuario no existe"**: Cuando el usuario no guardó el evento ni tiene registro
  - **"No pagado"**: Cuando el usuario tiene registro pendiente/rechazado pero no aprobado
  - **"Usuario no confirmado"**: Cuando el usuario existe pero no cumple los requisitos
  - **Lógica Mejorada**: Ahora diferencia entre 3 casos específicos en vez de mensaje genérico

### Technical Details
```
Modified:
- ../WoWBack/event-analyzer/server/routes/events.js (scan-attendance validation logic)

Validation Flow:
1. Check if user exists in saved_events or event_registrations
   → If NO: "Usuario no existe"
2. Check if user has registration but status != 'approved' and no saved_event
   → If YES: "No pagado"
3. Check if user is confirmed (saved OR approved)
   → If NO: "Usuario no confirmado"
   → If YES: Record attendance ✅
```

### Error Messages
```javascript
// Before (generic)
"User is not confirmed for this event"

// After (specific)
Case 1: "Usuario no existe"        // Not in database for this event
Case 2: "No pagado"                 // Has registration but not approved
Case 3: "Usuario no confirmado"     // Edge case fallback
```

---

## [0.0.12] - 2026-01-27

### Fixed
- 🐛 **QR Attendance Scanning Bug**: Fixed critical bug where QR scanning failed due to missing `host_user_id` parameter
  - **Root Cause**: Backend endpoint `/api/events/:eventId/scan-attendance` requires 3 parameters but frontend was only sending 2
  - **Solution**: Updated `scanAttendance()` in `api.ts` to accept and send `hostUserId` parameter
  - **Impact**: QR attendance scanning now works correctly for host users
  - **Error Messages**: Added comprehensive error handling with user-friendly Spanish messages:
    - Usuario no confirmado para eventos de pago
    - Evento no requiere control de asistencia
    - Solo el host puede escanear
  - **Auto-Refresh**: Attendance list now refreshes automatically after successful scan

### Changed
- ✅ **Better Error Handling in QR Scanner**:
  - Improved `handleQRScanned()` in `myevents.tsx` with specific error messages
  - Extracts and displays backend error messages when available
  - Fallback generic message if backend doesn't provide details

### Technical Details
```
Modified:
- frontend/src/services/api.ts (added hostUserId parameter to scanAttendance function)
- frontend/app/myevents.tsx (updated handleQRScanned to pass user.id, better error handling, auto-refresh)

API Call Changes:
Before: scanAttendance(eventId, scannedUserId)
After:  scanAttendance(eventId, scannedUserId, hostUserId)

Backend Endpoint:
POST /api/events/:eventId/scan-attendance
Body: { scanned_user_id, host_user_id }
```

### Testing
```
✅ Host can scan user QR codes
✅ Validates user confirmation status
✅ Prevents duplicate scans
✅ Shows specific error messages
✅ Refreshes attendance list after scan
✅ Only event host can scan
```

---

## [0.0.11] - 2026-01-27

### Added
- 🎫 **Sistema de Asistencia con QR**: Implementación completa para control de asistencia física en eventos
  - **Campo en Eventos**: Nuevo campo `requires_attendance_check` (boolean) para activar control de asistencia
  - **Toggle en Creación**: Opción "Llevar asistencia" disponible cuando el usuario es anfitrión
  - **QR Personal de Usuario**: 
    - Tabla `user_qr_codes` con generación automática por trigger al crear usuario
    - Botón "ESCANEAR" en perfil para mostrar QR personal a pantalla completa
    - QR contiene el `user_id` del usuario para identificación
  - **Escáner para Hosts**:
    - Componente `QRScanner.tsx` con cámara integrada
    - Botón morado "Escanear" en eventos del host (tab Anfitrión)
    - Escanea QR personal del usuario y registra asistencia automáticamente
    - Validación: solo el host puede escanear, no permite duplicados
  - **Lista de Asistencia Avanzada**:
    - Modal mejorado con estadísticas (Confirmados vs Asistieron)
    - Indicadores visuales: ✓ checkmark morado (asistió), ⏳ reloj naranja (pendiente)
    - Timestamps de escaneo con hora exacta
    - Diferenciación entre asistencia automática y escaneada por host
  - **Campos Nuevos en `attended_events`**:
    - `scanned_by_host` (boolean): Indica si fue escaneado físicamente
    - `scanned_at` (timestamp): Momento del escaneo
    - `scanned_by_user_id` (uuid): ID del host que escaneó

- 📡 **Endpoints API de Asistencia** (Backend):
  - `POST /api/events/:eventId/scan-attendance` - Escanear QR y registrar asistencia
  - `GET /api/events/:eventId/attendance-list` - Obtener lista completa de asistencia
  - `PATCH /api/events/:eventId/attendance-requirement` - Activar/desactivar control de asistencia

- 🔐 **Seguridad y Validaciones**:
  - RLS políticas para `user_qr_codes` (solo el usuario ve su propio QR)
  - Validación de host: solo el dueño del evento puede escanear
  - Prevención de escaneos duplicados
  - Validación de confirmación previa en eventos de pago

- 📚 **Documentación Completa**:
  - `/docs/PLAN_ATTENDANCE_TRACKING.md` - Arquitectura del sistema
  - `/docs/API_ATTENDANCE_ENDPOINTS.md` - Documentación de endpoints
  - `/docs/TESTING_GUIDE_ATTENDANCE.md` - Guía de pruebas

### Changed
- 🔄 **Lista de Asistentes**: Mejorada para diferenciar entre eventos normales y con control de asistencia
  - Eventos normales: muestra usuarios interesados (saved_events)
  - Eventos con asistencia: muestra solo confirmados y escaneados con estadísticas
- 🎨 **UI/UX en MyEvents**: 
  - Botones rediseñados para hosts con iconos claros
  - Colores consistentes: morado (escanear), naranja (lista), rojo (eliminar)

### Technical Details
```
Modified:
- frontend/app/create.tsx (toggle "Llevar asistencia")
- frontend/app/myevents.tsx (integración QRScanner, lista de asistencia mejorada)
- frontend/app/profile.tsx (botón "ESCANEAR" y QR personal)
- frontend/src/services/api.ts (3 funciones: scanAttendance, getAttendanceList, updateAttendanceRequirement)
- backend/server/routes/events.js (3 endpoints nuevos)

Created:
- frontend/src/components/QRScanner.tsx (componente escáner con cámara)
- frontend/src/components/UserQRCode.tsx (generador de QR personal)
- database/migrations/add_attendance_tracking.sql (migración completa)
- docs/PLAN_ATTENDANCE_TRACKING.md
- docs/API_ATTENDANCE_ENDPOINTS.md
- docs/TESTING_GUIDE_ATTENDANCE.md
```

### Database Migrations
```sql
-- Tabla de códigos QR personales
CREATE TABLE user_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  qr_data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Trigger para generar QR automáticamente
CREATE TRIGGER generate_user_qr_on_profile_insert
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION generate_user_qr_code();

-- Campos nuevos en attended_events
ALTER TABLE attended_events ADD COLUMN scanned_by_host boolean DEFAULT false;
ALTER TABLE attended_events ADD COLUMN scanned_at timestamptz;
ALTER TABLE attended_events ADD COLUMN scanned_by_user_id uuid REFERENCES auth.users(id);

-- Campo nuevo en events
ALTER TABLE events ADD COLUMN requires_attendance_check boolean DEFAULT false;
```

### Flujo Completo
```
1. Host crea evento con "Llevar asistencia" activado ✅
2. Usuarios guardan evento (confirmación si es de pago) ✅
3. Día del evento: Usuario muestra QR personal (Perfil > ESCANEAR) ✅
4. Host escanea QR (Mis Eventos > Anfitrión > Escanear) ✅
5. Sistema registra asistencia automáticamente ✅
6. Host ve estadísticas en Lista de Asistencia ✅
```

---

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
