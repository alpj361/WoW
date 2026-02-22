# WOW - Descubre y Vive Eventos

![Version](https://img.shields.io/badge/version-0.0.3-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB)
![Expo](https://img.shields.io/badge/Expo-54.0-000020)

Aplicación móvil y web para descubrir y gestionar eventos locales, con autenticación, perfil digital, procesiones y una interfaz tipo swipe.

## 📱 Plataformas

- **iOS** — Nativo
- **Android** — Nativo
- **Web** — Viewport móvil simulado (428px), desplegado en Vercel

## ✨ Características

- 🎯 **Swipe Interface** — Desliza para guardar o pasar eventos
- 🔐 **Autenticación** — Login con email/magic link via Supabase Auth
- 👤 **Perfil Digital** — Tarjeta digital personal con QR
- 🎭 **Procesiones** — Vista dedicada para procesiones con detalle completo
- 💬 **Reacciones** — Comentarios públicos en eventos asistidos
- 🗂️ **Mis Eventos** — Eventos guardados y asistidos por el usuario
- 🌙 **Dark Mode** — Diseño oscuro con glass morphism
- ⚡ **Animaciones** — Reanimated 4 + Lottie
- 🧭 **Tab Bar Glass** — Barra inferior con blur, visible en web solo para usuarios autenticados

> 🌟 **Misión y Visión**: [MISSION_VISION.md](fundamental_docs/MISSION_VISION.md)

---

## 🏗️ Arquitectura del Proyecto

```
WoW/
├── frontend/                        # Aplicación React Native + Expo
│   ├── app/                         # Rutas (Expo Router - file-based routing)
│   │   ├── _layout.tsx              # Layout raíz: AuthProvider, Tabs, GlassTabBar
│   │   ├── index.tsx                # Explorar eventos (swipe feed)
│   │   ├── create.tsx               # Crear nuevo evento
│   │   ├── myevents.tsx             # Eventos guardados y asistidos
│   │   ├── places.tsx               # Spots / lugares
│   │   ├── profile.tsx              # Perfil de usuario
│   │   ├── extractions.tsx          # Extracciones de datos (dev)
│   │   ├── radial-demo.tsx          # Demo radial intro (dev)
│   │   ├── auth.tsx                 # Pantalla de login / registro
│   │   ├── auth-callback.tsx        # Callback de OAuth / magic link
│   │   ├── auth-verify.tsx          # Verificación de sesión
│   │   ├── terminos.tsx             # Términos y condiciones
│   │   ├── privacidad.tsx           # Política de privacidad
│   │   └── event/
│   │       └── [id].tsx             # Detalle de evento (ruta dinámica)
│   │
│   └── src/
│       ├── components/              # Componentes reutilizables
│       │   ├── GlassTabBar.tsx      # Tab bar con blur (web: solo usuarios autenticados)
│       │   ├── WebViewport.tsx      # Wrapper viewport móvil en web
│       │   ├── EventCard.tsx        # Tarjeta de evento con swipe
│       │   ├── EventDetailModal.tsx # Modal de detalle de evento
│       │   ├── EventForm.tsx        # Formulario de creación de evento
│       │   ├── EventReactionsModal.tsx # Reacciones públicas en eventos
│       │   ├── FeedModeToggle.tsx   # Toggle entre modos del feed
│       │   ├── CategoryFilter.tsx   # Filtro por categorías
│       │   ├── ProcessionesListView.tsx  # Lista de procesiones
│       │   ├── ProcessionDetailModal.tsx # Modal detalle de procesión
│       │   ├── DigitalCard.tsx      # Tarjeta digital con QR
│       │   ├── UserQRCode.tsx       # Generador de QR de usuario
│       │   ├── QRScanner.tsx        # Escáner de QR
│       │   ├── ProfileScreen.tsx    # Pantalla de perfil completa
│       │   ├── VerticalEventStack.tsx  # Stack vertical de eventos
│       │   ├── AudienceSelector.tsx # Selector de audiencia
│       │   ├── SubcategorySelector.tsx # Selector de subcategorías
│       │   ├── TagSelector.tsx      # Selector de etiquetas
│       │   ├── EmojiRating.tsx      # Calificación con emojis
│       │   ├── CuaresmaBanner.tsx   # Banner de Cuaresma
│       │   ├── FreshDataBanner.tsx  # Banner de datos frescos
│       │   ├── SkeletonLoader.tsx   # Skeleton de carga
│       │   ├── AnimatedButton.tsx   # Botón con animación
│       │   ├── AnimatedLoader.tsx   # Loader animado
│       │   ├── AnimatedToast.tsx    # Toast animado
│       │   ├── CollectibleAnimation.tsx # Animación de coleccionables
│       │   ├── GlassSphere.tsx      # Esfera de glass morphism
│       │   ├── OrbitingAvatars.tsx  # Avatares orbitales
│       │   ├── RadialIntro.tsx      # Intro radial animada
│       │   ├── SplashScreen.tsx     # Splash screen con video/Lottie
│       │   ├── SwipeOverlay.tsx     # Overlay de swipe
│       │   ├── WowLogo.tsx          # Logo animado de WoW
│       │   └── pins/
│       │       ├── AttachedPin.tsx  # Pin adjunto a perfil
│       │       ├── FounderPin.tsx   # Pin de fundador
│       │       ├── PinAwardOverlay.tsx # Overlay de otorgamiento de pin
│       │       └── PinMovementTest.tsx # Test de movimiento de pins
│       │
│       ├── context/
│       │   └── AuthContext.tsx      # Estado global de autenticación
│       │
│       ├── store/                   # Zustand stores
│       │   ├── eventStore.ts        # Eventos del feed
│       │   ├── draftStore.ts        # Borradores de eventos
│       │   ├── procesionStore.ts    # Procesiones
│       │   └── extractionStore.ts  # Extracciones de datos
│       │
│       ├── services/
│       │   ├── supabase.ts          # Cliente Supabase (DB + Auth)
│       │   ├── api.ts               # Llamadas al backend API
│       │   └── eventAnalyzer.ts     # Análisis de eventos con IA
│       │
│       ├── constants/
│       │   └── audiences.ts         # Constantes de audiencias
│       │
│       ├── data/
│       │   └── cuaresma-data.ts     # Datos de procesiones de Cuaresma
│       │
│       └── utils/
│           ├── authState.ts         # Estado de auth callback (singleton)
│           └── dateUtils.ts         # Utilidades de fechas
│
├── event-analyzer/                  # Módulo de análisis de eventos
├── database/                        # Migraciones y esquemas SQL
├── docs/                            # Documentación adicional
├── fundamental_docs/                # Misión, visión, decisiones
├── scripts/                         # Scripts de utilidad
├── tests/                           # Tests del proyecto
├── vercel.json                      # Configuración de deployment Vercel
└── README.md
```

> **Backend**: Vive en un repositorio y servidor separado. Producción en `api.standatpd.com`.

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.81.5 | Framework móvil |
| Expo | ~54.0 | SDK y toolchain |
| Expo Router | ~6.0 | Navegación file-based |
| React Native Reanimated | ^4.1 | Animaciones de alto rendimiento |
| React Native Gesture Handler | ^2.28 | Gestos táctiles |
| Lottie React Native | ^7.3 | Animaciones Lottie |
| Zustand | ^5.0 | State management |
| Supabase JS | ^2.91 | Base de datos + Auth |
| Expo Blur | ~15.0 | Efecto blur / glass |
| Expo Linear Gradient | ^15.0 | Gradientes |
| Expo Auth Session | ^7.0 | OAuth / magic link |
| React Native QR Code SVG | ^6.3 | Generación de QR |
| Flash List | 2.0.2 | Listas de alto rendimiento |
| TypeScript | ~5.9 | Tipado estático |

### Backend (repositorio separado)
- **Node.js + Express** — Servidor API
- **Supabase** — PostgreSQL + Auth + Storage
- **OpenAI** — Análisis de imágenes y eventos

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- npm
- Expo CLI

### Pasos

```bash
# 1. Clonar
git clone https://github.com/alpj361/WoW.git
cd WoW/frontend

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Configurar variables de entorno
# Copiar .env.example a .env y llenar los valores de Supabase
```

---

## 📱 Ejecutar

```bash
# Web (localhost:8081)
npm run web

# iOS (requiere macOS + Xcode)
npm run ios

# Android
npm run android

# Expo Go (escanear QR con la app)
npm start

# Build web para producción
npm run build:web
```

---

## 🧭 Rutas de la Aplicación

| Ruta | Descripción | Auth requerida |
|---|---|---|
| `/` (index) | Feed de exploración con swipe | No (guest permitido) |
| `/event/[id]` | Detalle de un evento | No (guest permitido) |
| `/create` | Crear nuevo evento | Sí |
| `/myevents` | Eventos guardados y asistidos | Sí |
| `/places` | Spots y lugares | Sí |
| `/profile` | Perfil, tarjeta digital, QR | Sí |
| `/extractions` | Panel de extracciones (dev) | Sí |
| `/auth` | Login / registro | No |
| `/auth-callback` | Callback de magic link / OAuth | No |
| `/auth-verify` | Verificación de sesión | No |
| `/terminos` | Términos y condiciones | No |
| `/privacidad` | Política de privacidad | No |

---

## 🎨 Diseño

### Paleta de Colores
| Elemento | Color |
|---|---|
| Fondo principal | `#0F0F0F` |
| Acento primario | `#8B5CF6` (púrpura) |
| Eventos musicales | `#8B5CF6 → #6D28D9` |
| Voluntariado | `#EC4899 → #BE185D` |
| General | `#F59E0B → #D97706` |
| Éxito / Login | `#10B981` |
| Texto | `#FFFFFF` |
| Texto secundario | `#6B7280` |

### Glass Tab Bar (Web)
- **Guest**: oculta (sin tab bar en web)
- **Autenticado**: visible con `backdropFilter: blur(24px)` y borde púrpura superior
- **Nativo**: `BlurView` de expo-blur con `intensity: 50, tint: dark`

---

## 🌐 Deployment

### Web — Vercel
```
Build command: cd frontend && npm install --legacy-peer-deps && npm run build:web
Output dir:    frontend/dist
```
Push a `main` → deploy automático.

### Mobile — EAS (Expo Application Services)
```bash
eas build:configure
eas build --platform all
```

---

## 📄 Documentación adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Guía de deployment y troubleshooting
- [CHANGELOG.md](./CHANGELOG.md) — Historial de cambios
- [fundamental_docs/](./fundamental_docs/) — Misión, visión y decisiones de arquitectura

---

## 👥 Autores

- **Equipo WOW** — Desarrollo

## 📄 Licencia

Código abierto.
