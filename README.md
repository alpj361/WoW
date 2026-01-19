# WOW - Descubre y Vive Eventos

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB)
![Expo](https://img.shields.io/badge/Expo-54.0-000020)

Una aplicación móvil y web para descubrir y gestionar eventos locales con una interfaz de swipe tipo Tinder.

## 📱 Demo

La aplicación está optimizada para funcionar en:
- **iOS** (Nativo)
- **Android** (Nativo)
- **Web** (Con viewport móvil simulado)

## ✨ Características

- 🎯 **Swipe Interface**: Desliza hacia la derecha para guardar eventos, izquierda para pasar
- 🎨 **Categorías**: Filtra eventos por Música, Voluntariado o General
- 📱 **Responsive**: Se adapta perfectamente a móvil y web
- 🌙 **Dark Mode**: Diseño oscuro moderno
- ⚡ **Animaciones Fluidas**: Transiciones suaves con Reanimated
- 💾 **Gestión de Estado**: Zustand para state management

## 🏗️ Arquitectura del Proyecto

```
WOW/
├── frontend/                    # Aplicación React Native + Expo
│   ├── app/                     # Rutas de la aplicación (Expo Router)
│   │   ├── index.tsx           # Pantalla principal (Explorar eventos)
│   │   ├── create.tsx          # Crear nuevos eventos
│   │   ├── myevents.tsx        # Eventos guardados y asistidos
│   │   ├── profile.tsx         # Perfil de usuario
│   │   └── _layout.tsx         # Layout principal con tabs
│   │
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── EventCard.tsx   # Tarjeta de evento con animaciones
│   │   │   ├── CategoryFilter.tsx  # Filtro de categorías
│   │   │   ├── WebViewport.tsx     # Wrapper para viewport móvil en web
│   │   │   └── EmojiRating.tsx     # Selector de emojis para calificación
│   │   │
│   │   └── store/
│   │       └── eventStore.ts   # Store de Zustand (state management)
│   │
│   ├── .env                     # Variables de entorno
│   ├── app.json                 # Configuración de Expo
│   └── package.json             # Dependencias del proyecto
│
├── backend/                     # Backend API (FastAPI + Python)
│   ├── server.py               # Servidor FastAPI
│   └── requirements.txt        # Dependencias Python
│
└── tests/                       # Tests del proyecto
    └── test_result.md

```

## 🛠️ Stack Tecnológico

### Frontend
- **React Native** 0.81.5 - Framework móvil
- **Expo** 54.0 - Toolchain y SDK
- **Expo Router** 5.1.4 - Navegación basada en archivos
- **React Native Reanimated** 3.17.4 - Animaciones de alto rendimiento
- **React Native Gesture Handler** 2.24.0 - Gestos táctiles
- **Zustand** 5.0.10 - State management minimalista
- **Expo Linear Gradient** 15.0.8 - Gradientes visuales
- **TypeScript** 5.8.3 - Tipado estático

### Backend ⚠️ (En desarrollo)
- **FastAPI** - Framework API Python
- **MongoDB** - Base de datos NoSQL
- **Motor** - Driver async MongoDB

> **⚠️ IMPORTANTE - Datos Mock Temporales**
>
> Actualmente, la aplicación usa **datos de ejemplo locales** (mock data) incluidos directamente en el frontend. El backend con FastAPI y MongoDB está disponible pero **no es necesario** para ejecutar la demo. Los datos mock son temporales y serán reemplazados cuando el backend esté completamente integrado.

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Expo CLI (se instala automáticamente)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/alpj361/WoW.git
cd WoW/frontend
```

2. **Instalar dependencias**
```bash
npm install --legacy-peer-deps
```

3. **Configurar variables de entorno** (Opcional - para backend futuro)
```bash
# El archivo .env ya existe con valores por defecto
# EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 📱 Ejecutar la Aplicación

### Modo Desarrollo

#### Web
```bash
npm run web
```
La aplicación se abrirá en `http://localhost:8081` con un viewport móvil simulado (390x844px).

#### iOS (requiere macOS)
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Expo Go (Física)
```bash
npm start
```
Escanea el QR con la app Expo Go en tu dispositivo.

## 🎯 Funcionalidades Implementadas

### ✅ Pantalla de Exploración (index.tsx)
- [x] Swipe gestures para navegar eventos
- [x] Animaciones fluidas de transición
- [x] Botones de acción (Guardar/Pasar)
- [x] Filtrado por categorías
- [x] Carga de eventos (mock data)
- [x] Compatible con web y móvil

### ✅ Tarjetas de Eventos (EventCard.tsx)
- [x] Diseño responsive
- [x] Gradientes por categoría
- [x] Información completa del evento
- [x] Iconos de categoría
- [x] Optimizado para 25% de altura de pantalla

### ✅ Sistema de Categorías
- [x] Música (Púrpura)
- [x] Voluntariado (Rosa)
- [x] General (Ámbar)
- [x] Filtrado en tiempo real

### ⏳ En Desarrollo
- [ ] Crear eventos personalizados
- [ ] Perfil de usuario
- [ ] Integración con backend
- [ ] Autenticación de usuarios
- [ ] Eventos en tiempo real

## 📊 Estructura de Datos

### Evento (Event)
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  category: 'music' | 'volunteer' | 'general';
  image: string | null;
  date: string | null;        // Formato: "2025-07-20"
  time: string | null;        // Formato: "21:00"
  location: string | null;
  created_at: string;
}
```

### Eventos de Ejemplo
La aplicación incluye **10 eventos precargados**:
- 3 eventos de Música (Jazz, Rock, Sinfónico)
- 3 eventos de Voluntariado (Limpieza, Reforestación, Comedor)
- 4 eventos Generales (Food Trucks, Networking, Mercado, Yoga)

## 🎨 Diseño

### Paleta de Colores
- **Fondo Principal**: `#0F0F0F` (Negro suave)
- **Música**: `#8B5CF6` → `#6D28D9` (Púrpura)
- **Voluntariado**: `#EC4899` → `#BE185D` (Rosa)
- **General**: `#F59E0B` → `#D97706` (Ámbar)
- **Texto**: `#FFFFFF` (Blanco)
- **Texto Secundario**: `#6B7280` (Gris)

### Componentes UI
- **Tarjetas**: Border radius 16px, altura 25% viewport
- **Botones**: Circulares 48x48px con bordes de 2px
- **Tipografía**: Sistema nativo con pesos 500-800
- **Animaciones**: Spring physics para suavidad natural

## 🔧 Configuración Avanzada

### Viewport Web (WebViewport.tsx)
El componente `WebViewport` simula un dispositivo móvil en web:
- Ancho: 390px (iPhone 14 Pro)
- Altura: 844px máximo
- Border radius: 20px
- Box shadow para efecto 3D

### Swipe Híbrido
La aplicación detecta la plataforma y adapta el comportamiento:
- **Móvil**: Gestos táctiles completos con `GestureDetector`
- **Web**: Animaciones visuales + botones clickeables

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor Expo
npm run web        # Ejecutar en navegador
npm run ios        # Ejecutar en iOS
npm run android    # Ejecutar en Android
npm run lint       # Ejecutar ESLint
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto.

## 👥 Autores

- **Equipo WOW** - Desarrollo inicial

## 🙏 Agradecimientos

- Expo team por el increíble framework
- React Native community
- Iconos de @expo/vector-icons

---

**Nota**: Esta es una versión demo con datos de ejemplo. El backend y la autenticación están en desarrollo activo
