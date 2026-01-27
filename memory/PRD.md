# WOW - App de Eventos

## Descripción
App de eventos tipo swipe (similar a Tinder) con colección de eventos asistidos estilo Letterboxd.

## Stack Tecnológico
- **Frontend:** Expo + React Native + TypeScript
- **Backend:** FastAPI + Supabase
- **Animaciones:** React Native Reanimated
- **Gestos:** React Native Gesture Handler

## Mejoras Implementadas (27 Ene 2026)

### Alta Prioridad - WOW Inmediato ✅
1. **Overlay de Swipe con Colores**
   - Indicador visual "GUARDAR" (verde #10B981) al swipear derecha
   - Indicador visual "PASAR" (rojo #EF4444) al swipear izquierda
   - Animación scale y opacity progresiva según distancia del swipe

2. **Haptic Feedback + Animaciones en Botones**
   - Scale down (0.85) + rotation wiggle en botones like/skip
   - Haptic feedback diferenciado: success para like, medium para skip
   - Implementado con React Native Reanimated + expo-haptics

3. **Toast Notifications Animados**
   - Toast flotante con animación spring al guardar/pasar
   - Iconos y colores contextuales por tipo (like, skip, success, error, info)
   - Auto-hide después de 1.5-2 segundos

4. **Skeleton Loaders**
   - Skeleton animado con shimmer effect para listas de eventos
   - Skeleton específico para tarjeta de swipe
   - Reemplaza ActivityIndicator genérico

### Componentes Nuevos Creados
- `/src/components/SwipeOverlay.tsx` - Overlay direccional
- `/src/components/AnimatedToast.tsx` - Notificaciones toast
- `/src/components/SkeletonLoader.tsx` - Loaders skeleton
- `/src/components/AnimatedButton.tsx` - Botones con haptic

### Componentes Mejorados
- `EventCard.tsx` - Botones con animaciones
- `EmojiRating.tsx` - Emojis con bounce animation
- `index.tsx` - Integración de overlays y toasts
- `myevents.tsx` - Skeleton loaders + staggered animations

## Paleta de Colores (Mantenida)
- Background: #0F0F0F, #121212
- Cards: #1F1F1F, #2A2A2A
- Primary: #8B5CF6 (violeta)
- Success: #10B981 (verde)
- Error: #EF4444 (rojo)
- Warning: #F59E0B (naranja)

## Backlog - Próximas Mejoras

### Media Prioridad
- [ ] Floating tab bar con indicador animado
- [ ] Confetti burst al calificar con emoji
- [ ] Glassmorphism en badges de categoría
- [ ] Staggered animations en más listas

### Nice to Have
- [ ] Custom icons (Lucide en lugar de Ionicons)
- [ ] Double-tap para super like
- [ ] Animated avatar ring
- [ ] Breathing glow en tarjeta digital

## Notas Técnicas
- App requiere autenticación (Supabase Auth)
- Metro Bundler corre en puerto 8081
- Hot reload habilitado
