# Changelog

All notable changes to the WOW Events project will be documented in this file.

## [0.0.30] - 2026-02-18

### Fixed & Improved — Procesiones: Turno, Desmarcar y My Events

#### 1. Persistencia del Número de Turno (`ProcessionesListView.tsx`)
- **Fix de persistencia**: Después de guardar el turno con `cargarTurno()`, ahora se llama también a `fetchCargandoTurnos()` para refrescar el estado desde la base de datos y confirmar que el turno quedó guardado correctamente.

#### 2. Opción de Desmarcar Turno (`procesionStore.ts` + `ProcessionesListView.tsx`)
- **Nueva función `descargarTurno(procesionId)`** en el store: hace `DELETE` en la tabla `procession_cargadores` y limpia el estado local inmediatamente.
- **Botón "Desmarcar turno"** (rojo) en el modal de turno: aparece solo cuando el usuario ya tiene un turno guardado para esa procesión.
- El usuario puede desmarcar su participación en cualquier momento sin necesidad de cerrar y volver a abrir el modal.

#### 3. Badge de Turno en My Events (`myevents.tsx`)
- La pantalla **"Interesados"** ahora carga también `fetchCargandoTurnos()` y `fetchProcesiones('cuaresma-2026')` al inicializarse.
- **Lista combinada**: Se muestran procesiones guardadas **más** procesiones donde el usuario tiene turno activo (sin duplicados). El contador de la pestaña incluye ambos tipos.
- **Badge dorado** `#turno` con ícono `people-carry` en la esquina inferior izquierda de cada tarjeta donde el usuario es cargador.
- Las tarjetas con turno activo muestran borde dorado `rgba(234, 179, 8, 0.4)` para distinguirlas visualmente.

#### 4. Eliminación de Botones de Google Maps (`ProcessionDetailModal.tsx`)
- **Removido completamente** el botón "Ver recorrido en Google Maps" de cada procesión.
- La sección de recorrido ahora solo aparece cuando la procesión tiene `live_tracking_url` activo, mostrando únicamente el botón "Seguir en vivo".

#### Archivos Modificados
```
Modified:
- frontend/src/store/procesionStore.ts (nueva función descargarTurno)
- frontend/src/components/ProcessionesListView.tsx (fix persistencia, botón desmarcar)
- frontend/src/components/ProcessionDetailModal.tsx (eliminación Google Maps)
- frontend/app/myevents.tsx (badge turno, lista combinada, fetch cargandoTurnos)
```

---

## [0.0.29] - 2026-02-18

### Added — Edición de Eventos

**`EventForm.tsx`** — Modo edición reutilizable
- Nueva prop `eventId`: cuando se provee, el formulario opera en `isEditMode = true`
- Llama `updateEvent(eventId, payload)` en lugar de `createEvent`
- En modo edición invoca `onSuccess()` sin redirigir al feed
- Nueva prop `isModal` ajusta header/padding para presentación como sheet

**`event/[id].tsx`** — Editar desde pantalla de detalle
- Botón pencil flotante (top-right) visible solo para usuarios autenticados en eventos públicos (`user_id = null`)
- `canEditFromDetail`: solo activo cuando el evento no tiene dueño específico
- Modal `pageSheet` monta `EventForm` en modo edición; al guardar, recarga el evento

**`myevents.tsx`** — Editar eventos del host
- Botón pencil en cada hosted event card (junto al trash)
- `editModal` state abre `EventForm` en modo edición como `pageSheet`
- Refresca `fetchHostedEvents()` al guardar con éxito

**`eventStore.ts`** — Nueva acción `updateEvent`
- PATCH en Supabase filtrando por `id` AND `user_id` (solo el dueño puede editar)
- Actualiza todos los campos del evento incluyendo `subcategory`, `tags`, `recurring_dates`, `target_audience`
- Llama `fetchHostedEvents()` automáticamente tras el update

#### Archivos Modificados
```
Modified:
- frontend/app/event/[id].tsx (edit modal, floating pencil button)
- frontend/app/myevents.tsx (edit modal en tab Anfitrión)
- frontend/src/components/EventForm.tsx (props eventId + isModal, modo edición)
- frontend/src/store/eventStore.ts (nueva acción updateEvent)
```

---

## [0.0.28] - 2026-02-17

### Fixed — Guest Login Navigation

**Problema**: El botón "Guest Login" no navegaba correctamente a `/auth`, causando pérdida de estado de navegación.

**Causa Raíz**: 
- El `Tabs` navigator se desmontaba cuando el usuario navegaba a rutas de autenticación
- Conflicto entre renderizado condicional de `Slot` vs `Tabs` en `app/_layout.tsx`
- Al cambiar entre `Tabs` y `Slot`, el estado de navegación se perdía

**Solución**:
- **Tabs Persistente**: Mantener el `Tabs` navigator montado en todo momento
- **Tab Bar Condicional**: Ocultar el tab bar en rutas de autenticación sin desmontar el navigator
- Implementado `tabBar={(props) => isAuthRoute ? null : <GlassTabBar {...props} />}`

#### Archivos Modificados

**`app/_layout.tsx`** — Refactorización de navegación
- Eliminado renderizado condicional de `Slot` que desmontaba `Tabs`
- Todas las rutas (`auth`, `auth-callback`, `auth-verify`, `terminos`, `privacidad`) ahora son `Tabs.Screen`
- Nueva prop `tabBar` condicional que retorna `null` en rutas auth en lugar de desmontar
- Agregado logging de `segments`, `isAuthRoute`, `user` para debugging

**`src/components/GlassTabBar.tsx`** — Mejora de logging
- Cambiado `router.replace('/auth')` → `router.push('/auth')` para preservar stack
- Logging más descriptivo: `"🔘 Guest Login button pressed - attempting push to /auth"`
- Manejo especial para web: `window.location.href = '/auth'`

**`app/auth.tsx`** — Logging de lifecycle
- Agregado `useEffect` para logging de mount/unmount del componente
- `console.log('✅ AuthScreen mounted')` / `console.log('👋 AuthScreen unmounted')`

### Technical Details
```typescript
// Antes (navegación inestable)
{isAuthRoute ? (
  <Slot />  // Desmonta Tabs completamente
) : (
  <Tabs tabBar={(props) => <GlassTabBar {...props} />}>
    {/* rutas principales */}
  </Tabs>
)}

// Después (navegación estable)
<Tabs tabBar={(props) => isAuthRoute ? null : <GlassTabBar {...props} />}>
  {/* TODAS las rutas, incluyendo auth */}
  <Tabs.Screen name="auth" options={{ href: null }} />
  <Tabs.Screen name="auth-callback" options={{ href: null }} />
  {/* ... rutas principales */}
</Tabs>
```

---

### Added — Procesiones de Cuaresma 2026

Nueva funcionalidad para visualizar y guardar procesiones de Semana Santa, con soporte para modo de invitado (guest browsing sin login).

#### Componentes Nuevos

**`ProcessionesListView.tsx`** — Stack de tarjetas interactivo
- **Navegación por gestos**: Swipe vertical con animaciones suaves (drag threshold 80px, velocity 500px/s)
- **Stack animado**: Hasta 5 tarjetas visible simultáneamente con efecto de profundidad
- **Indicadores visuales**:
  - Badge "HOY" para procesiones del día actual (verde con dot pulsante)
  - Badge "EN VIVO" durante horario de procesión (salida → entrada, maneja midnight overflow)
  - Contador de posición (01/25) con estilo monospace
  - Dots de navegación lateral con indicador alargado para tarjeta activa
- **Timeline/Cronograma**: Vista alternativa con scroll vertical agrupado por fecha
  - Header con contador total de procesiones
  - Badges de fecha con resaltado especial para "HOY"
  - Thumbnails con información compacta
- **Like/Save**: Heart button para usuarios autenticados (oculto para guests)
- **Support Web**: Mouse wheel navigation para desktop
- **Skeleton Loader**: Loading state con spinner y mensaje

**`CuaresmaBanner.tsx`** — Banner promocional
- Gradiente purple (`#581C87` → `#6B21A8` → `#7C3AED`)
- Icono de flor (`flower-outline`) en contenedor glassmorphic
- Badge "HOY" dinámico si hay procesiones hoy
- Contador: "X procesiones esta semana" / "X procesión(es) hoy · Y esta semana"
- Patrón decorativo de cruz con opacidad baja

**`ProcessionDetailModal.tsx`** — Modal de detalles
- Imagen de procesión en hero (280px height)
- Información completa: horarios, puntos de referencia, recorrido
- Galería de imágenes (procesión + recorrido)
- Botones: Guardar (heart), Cerrar
- Diseño dark con glassmorphism

**`FeedModeToggle.tsx`** — Selector de vista
- Toggle animado entre "Eventos" y "Cuaresma"
- Sliding indicator con spring animation
- Iconos: `compass-outline` (Eventos), `flower-outline` (Cuaresma)

#### Store y Data

**`src/store/procesionStore.ts`** — Zustand store con Supabase
```typescript
interface ProcesionDB {
  id: string;
  holiday_id: string | null;
  nombre: string;
  fecha: string;            // ISO "2026-02-17"
  hora_salida: string | null;
  hora_entrada: string | null;
  puntos_referencia: PuntoReferencia[];
  imagenes_procesion: string[];
  imagenes_recorrido: string[];
  source_url: string | null;
}
```

Funciones:
- `fetchProcesiones(holidaySlug)` — Fetch por holiday slug (`cuaresma-2026`)
- `fetchSavedProcesiones()` — Fetch procesiones guardadas del usuario
- `toggleSaveProcesion(procesionId)` — Save/unsave
- `isProcessionLive(proc)` — Detecta si está en vivo (maneja overnight)

**`src/data/cuaresma-data.ts`** — Helpers y datos locales
- `procesionesEstaSemana[]` — Array de 7 procesiones hardcoded (fallback)
- `parseProcesionDate()` — Parse "17 de febrero 2026" → Date
- `isToday()` — Check si fecha es hoy
- `formatShortDate()` — Format "MAR 17 FEB"
- `groupByDate()` — Group by fecha string

#### Integración en Feed Principal

**`app/index.tsx`** — Feed mode switcher
- Nuevo estado `feedMode: 'eventos' | 'cuaresma'`
- `FeedModeToggle` component en header
- Renderizado condicional: `EventStack` vs `ProcessionesListView`
- Preserva scroll position al cambiar modo

#### Base de Datos — Nuevas Tablas

**`procesiones`** — Tabla principal
```sql
CREATE TABLE procesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_id UUID REFERENCES holidays(id),
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_salida TIME,
  hora_entrada TIME,
  lugar_salida TEXT,
  puntos_referencia JSONB,
  imagenes_procesion TEXT[],
  imagenes_recorrido TEXT[],
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`saved_procesiones`** — Tabla de guardados
```sql
CREATE TABLE saved_procesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  procesion_id UUID REFERENCES procesiones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, procesion_id)
);
```

**`holidays`** — Catálogo de temporadas
```sql
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- "Cuaresma y Semana Santa"
  slug TEXT UNIQUE NOT NULL,       -- "cuaresma-2026"
  year INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

RLS Policies:
- `procesiones`: Public read access
- `saved_procesiones`: Users can only manage their own saves

#### Datos Iniciales

**Temporada**: Cuaresma 2026 (`slug: cuaresma-2026`)
- 7 procesiones del 17 al 22 de febrero 2026
- Procesiones de Guatemala, Zona 1 y Antigua Guatemala
- Imágenes de recorrido de guatemala.com
- Horarios completos con puntos de referencia

#### Guest Experience

- **Sin login**: Puede navegar todas las procesiones, ver detalles, timeline
- **Con login**: Puede guardar procesiones favoritas (heart button)
- No hay limitaciones de contenido para guests

### Technical Details
```
New Files:
- frontend/src/components/ProcessionesListView.tsx
- frontend/src/components/CuaresmaBanner.tsx
- frontend/src/components/ProcessionDetailModal.tsx
- frontend/src/components/FeedModeToggle.tsx
- frontend/src/store/procesionStore.ts
- frontend/src/data/cuaresma-data.ts

Modified:
- frontend/app/index.tsx (feed mode toggle integration)

Database Migrations:
- create_holidays_table
- create_procesiones_table
- create_saved_procesiones_table

Seed Data:
- holiday: Cuaresma 2026 (slug: cuaresma-2026)
- 7 procesiones iniciales (17-22 febrero 2026)
```

---

## [0.0.27] - 2026-02-14

### Improved — UX de Feed & Modales

#### Feed Logic Refinement
- **Smart End-of-List State**: Al llegar al final del feed:
  - Si hay nuevos eventos en background (`hasNewFeedData`): Muestra card "¡Nuevos eventos!" con botón "Cargar nuevos"
  - Si no hay nuevos: Muestra card "¡Has visto todos!" con opción de recargar
- **Background Refresh Integration**: `silentRefreshFeed` ahora se integra correctamente con la UI de final de lista, permitiendo actualizaciones suaves sin interrumpir la navegación.

#### Modal Layout Fixes
- **EventForm Modal Header**:
  - `EventForm` ahora acepta prop `isModal`
  - Renderiza header nativo con botón "Cancelar" y "Crear Evento" cuando está en modo modal
  - Ajuste de `paddingTop` fijo (20px) para evitar overlaps con status bar/notch en iOS sheet presentation
- **Visual Consistency**: El modal de edición de borradores ahora se ve consistente con el resto de la app.

### Fixed — Date Timezone Issues

- 📅 **Fechas mostrando día anterior**:
  - **Problema**: `new Date('YYYY-MM-DD')` interpretaba la fecha como UTC, causando que usuarios en occidente vieran el día anterior (e.g., 27 Oct -> 26 Oct a las 18:00).
  - **Solución**: Parsing manual de componentes de fecha (Año, Mes, Día) para construir el objeto `Date` en tiempo local del dispositivo.
  - Aplicado tanto a fecha principal como a `recurring_dates`.

### Technical Details
```typescript
// Fix de fecha para evitar UTC shift
const dateParts = initialData.date.split(/[-/]/);
// Manual parsing: new Date(year, month - 1, day)
// Evita new Date("2023-10-27") -> UTC 00:00 -> Local Oct 26 18:00
```

---

## [0.0.26] - 2026-02-14

### Added — Eliminar Evento Asistido con Press Sostenido

#### `myevents.tsx` — Tab Asistidos

- **Long press para eliminar**: En el tab "Asistidos", mantener presionado un poster abre confirmación de eliminación
  - **Press normal** → abre modal de reacciones (comportamiento anterior conservado)
  - **Press sostenido** → llama `handleRemoveAttended(eventId)` con confirmación nativa
    - iOS/Android: `Alert.alert` con botón "Eliminar" (destructivo) y "Cancelar"
    - Web: `window.confirm`
  - Si el usuario confirma → elimina de `attended_events` en Supabase + actualiza estado local con animación `Layout.springify()`

```tsx
// Antes
onLongPress={() => router.push(`/event/${event.id}`)}

// Después
onLongPress={() => handleRemoveAttended(event.id)}
```

### Verified — "¿Fuiste?" & not_attended_events

- Confirmado que tabla `not_attended_events` existe en Supabase con estructura correcta:
  - `id UUID`, `user_id UUID`, `event_id UUID`, `created_at TIMESTAMPTZ`
  - RLS policy `"Users manage own not_attended"`: `auth.uid() = user_id` (ALL operations)
- Flujo "No fui" verificado end-to-end:
  1. `upsert` en `not_attended_events` (señal negativa para algoritmo)
  2. `DELETE` en `saved_events`
  3. Estado local actualizado sin refetch
  4. Toast "Evento quitado de guardados"

### Technical Details
```
Modified:
- frontend/app/myevents.tsx (onLongPress en renderAttendedItem)
```

---

## [0.0.25] - 2026-02-14

### Added — Subcategorías, Tags, Event Features & "¿Fuiste?"

#### Catálogo de Subcategorías (`docs/SUBCATEGORIAS_CATALOGO.md`)
- **75+ subcategorías** organizadas por categoría principal (`music`, `volunteer`, `general`)
- Cada subcategoría tiene: `id`, `label`, `color` hex, `icon` (Ionicons)
- Bloque especial en `volunteer`: ONGs, causas sociales y comunidades
  - `lgbt-awareness`, `political-youth`, `university-awareness`, `ong-campaign`
  - `human-rights`, `womens-rights`, `indigenous-rights`, `migrant-support`
  - `anti-corruption`, `climate-activism`, `disability-rights`, `animal-rights`
  - `peace-culture`, `civic-education`, `social-entrepreneurship`
- Nueva subcategoría `art-music-gathering` → "Velada Arte & Música" para eventos híbridos

#### Nuevos Componentes

**`SubcategorySelector.tsx`** — Bottom sheet modal con buscador
- Trigger button: muestra selección activa (dot de color + icono + label) o placeholder
- Bottom sheet al 78% de pantalla con handle visual
- Searchbar "Buscar tipo de evento..." con filtrado en tiempo real (`useMemo`)
- Lista con icono en pill de color, checkmark morado en seleccionado
- Fila "Sin tipo de evento" para limpiar sin cerrar (solo si hay selección)
- Estado vacío con ícono de lupa si no hay resultados
- Filtrado automático por `category` activa; resetea al cambiar categoría

**`TagSelector.tsx`** — Chips multi-select con input personalizado
- Sugerencias predefinidas por categoría (12 tags por categoría)
- Toggle para agregar/quitar tags sugeridos
- Input para tags personalizados (normaliza a kebab-case)
- Tags personalizados se muestran con botón de eliminar separado
- Botón "Quitar todos los tags"

#### Base de Datos — 2 Migraciones

```sql
-- Migration: add_subcategory_tags_features
ALTER TABLE events ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_features JSONB;
ALTER TABLE event_drafts ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE event_drafts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE event_drafts ADD COLUMN IF NOT EXISTS event_features JSONB;

-- Migration: create_not_attended_events
CREATE TABLE not_attended_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
ALTER TABLE not_attended_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own not_attended"
  ON not_attended_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

#### Tipos TypeScript Actualizados

**`eventStore.ts`**
- `Event` interface: `subcategory?`, `tags?`, `event_features?` (mood/vibe/timeOfDay/socialSetting)
- Nueva función `markNotAttended(eventId)`:
  - Inserta en `not_attended_events` (upsert)
  - Elimina de `saved_events`
  - Actualiza estado local sin refetch
- `createEvent()` pasa los tres nuevos campos al API

**`draftStore.ts`**
- `EventDraft` y `DraftFormData`: `subcategory?`, `tags?`, `event_features?`
- `saveDraft()` y `publishDraft()` persisten los nuevos campos

**`api.ts`**
- `Event` y `CreateEventData` interfaces: nuevos campos `subcategory`, `tags`, `event_features`

#### `create.tsx` — Nuevos campos en formulario

Nuevo estado:
```typescript
const [subcategory, setSubcategory] = useState<string | null>(null);
const [tags, setTags] = useState<string[]>([]);
const [eventFeatures, setEventFeatures] = useState<Record<string, string>>({});
```

UI insertada después del selector de categoría:
1. `<SubcategorySelector>` — modal con buscador
2. `<TagSelector>` — chips + input personalizado
3. Sección "Características (Alpha)" — solo para usuarios alpha/beta/admin:
   - **Estado de ánimo**: energético, relajado, romántico, social, íntimo
   - **Ambiente**: casual, formal, underground, familiar, exclusivo
   - **Horario**: mañana, tarde, noche, madrugada
   - **Contexto social**: en pareja, con amigos, solo, en grupo, familiar

Cambiar categoría resetea subcategoría y tags automáticamente.

#### `myevents.tsx` — Prompt "¿Fuiste?" en tab Guardados

Helper `isEventPast()`: compara fecha del evento con hoy (sin timezone issues).

Para cada evento guardado con fecha pasada, se muestra debajo del card:
```
¿Fuiste a este evento?
[✓ Sí, fui]  [✕ No fui]
```
- **"Sí, fui"** → abre modal de emoji rating → mueve a tab Asistidos con animación de coleccionable
- **"No fui"** → registra en `not_attended_events`, elimina de guardados, toast "Evento quitado de guardados"

#### Datos — Enriquecimiento de Eventos Existentes

Todos los eventos existentes (26) fueron actualizados vía SQL con:
- `subcategory` asignada manualmente según título y contexto
- `tags` como array (`indoor`, `outdoor`, `18+`, `todo-público`, etc.)
- `event_features` JSONB con mood, vibe, timeOfDay, socialSetting

Correcciones de categoría principal:
- `entertainment` → `music` (Concierto Klaudia Ortiz, Bienal Arte Paiz, Metal Masters, Noche Astral, Tributo Juan Gabriel, Expo Latente, Concierto El Clubo)
- `entertainment` → `general` (Travesía Vías Férreas, Carrera por la Nutrición)
- `general` → `music` (Igualado en vivo, Los poemas muertos vol. 02)
- `volunteer` → `general` (Kermés de Halloween, Ascenso Volcán Chicabal)

### Technical Details
```
New Files:
- docs/SUBCATEGORIAS_CATALOGO.md
- frontend/src/components/SubcategorySelector.tsx
- frontend/src/components/TagSelector.tsx

Modified:
- frontend/app/create.tsx (subcategory/tags/features state + UI)
- frontend/app/myevents.tsx (¿Fuiste? prompt + markNotAttended)
- frontend/src/store/eventStore.ts (types + markNotAttended function)
- frontend/src/store/draftStore.ts (types + saveDraft/publishDraft)
- frontend/src/services/api.ts (Event + CreateEventData types)

Database Migrations:
- add_subcategory_tags_features
- create_not_attended_events

Data Migrations (SQL UPDATE):
- 26 eventos existentes enriquecidos con subcategory, tags, event_features
- Categorías principales corregidas en 9 eventos
```

---

## [0.0.24] - 2026-02-11

### Added - Event Details & Recurring Dates

#### Event Details Screen (`event/[id].tsx`)
- **Todos los nuevos campos visibles**:
  - `end_time` - Hora de finalización (19:00 - 22:00)
  - `organizer` - Nombre del organizador con icono de persona
  - `price` - Precio en verde con icono de etiqueta (Q50.00)
  - `requires_attendance_check` - Indicador amarillo "Requiere check-in con QR"
  - `target_audience` - Chips magenta con audiencia, universidades, miembros

#### Eventos Recurrentes - UI Mejorada
- **Vista unificada de fechas**: Todas las fechas se muestran juntas como chips
- **Indicador**: "Evento recurrente (X fechas)" con icono morado
- **Fecha principal destacada**: Borde más grueso para distinguirla
- Removida sección separada "Fechas adicionales"

#### Procesamiento Inteligente de Fechas (`extractions.tsx`)
- **Nueva función `processRecurringDates()`**:
  - Para eventos recurrentes: **IGNORA** el campo `date` (a menudo incorrecto)
  - Usa **SOLO** `recurring_dates` del análisis de IA
  - Selecciona la fecha más cercana al día actual como fecha principal
  - Resto de fechas futuras van a `recurringDates`
  - Ejemplo: fechas [12, 15, 17] y hoy es 14 → main=15, recurring=[17]

### Fixed

#### GlassSphere Web Blur
- **Reducido blur excesivo en web**: Las imágenes ahora son visibles
- Removido `backdrop-filter: blur()` del overlay estático
- Reducido blur de animación de 20px a 8px
- Reducida opacidad de 0.4 a 0.25

### Technical Details
```typescript
// Nueva lógica de fechas para eventos recurrentes
const { mainDate, recurringDates, isRecurring } = processRecurringDates(
    analysis.date,           // Se ignora si is_recurring=true
    analysis.recurring_dates,
    analysis.is_recurring
);

// Para eventos recurrentes con recurring_dates:
// 1. Ignora analysis.date (el AI a veces pone fechas incorrectas)
// 2. Usa solo recurring_dates
// 3. Ordena y filtra fechas pasadas
// 4. Primera fecha futura = mainDate
// 5. Resto = recurringDates
```

---

## [0.0.23] - 2026-02-11

### Added - Soon Places

Nueva pantalla de descubrimiento de lugares con efecto glassmorphic premium.

#### New Components
- **GlassSphere.tsx** - Componente de esfera de cristal con animaciones avanzadas
  - Efecto blur-jump al hacer tap (800ms)
  - Animación de escala: 1 → 0.90 → 1.05 → 0.99 → 1
  - Rotación sutil: 0 → 1.5deg → -0.5deg → 0
  - Zoom de imagen al presionar
  - Feedback háptico en dispositivos nativos
  - Soporte para 3 tamaños: `sm`, `md`, `lg`

#### Platform-Specific Glass Effects
- **iOS**: Silicon glass effect usando `expo-blur` BlurView con gradiente sutil
- **Web**: CSS glassmorphism con `backdrop-filter: blur(12px) saturate(180%)`

#### New Screen
- **places.tsx** - Nueva tab "Places" en posición central
  - Layout masonry con 2 columnas
  - 12 destinos: Paris, Tokyo, Bali, Portugal, New York, Alps, Kyoto, Maldives, Amsterdam, Shibuya, London, Istanbul
  - Título hero "SOON PLACES"
  - Indicador de scroll con efecto glass
  - Background negro (#0F0F0F) con acentos purple de la app

#### Navigation
- Nueva tab "Places" agregada a `GlassTabBar.tsx`
- Icono: globe/globe-outline
- Posición: 3ra (centro de 6 tabs)

---

## [0.0.22] - 2026-02-10

### Fixed - Vertical Feed & Gestures

#### Vertical Event Stack
- **Corregido conflicto de gestos** entre `VerticalEventStack` y `ScrollView`
- Separado el stack de gestos fuera del ScrollView cuando hay eventos
- Creado componente `AnimatedCard` interno para manejo correcto de animaciones
- Eliminados hooks de estilo animado duplicados

#### index.tsx Changes
```typescript
// Ahora renderiza condicionalmente
{showVerticalStack ? (
  <View style={styles.stackContainer}>
    <VerticalEventStack ... />
  </View>
) : (
  <ScrollView>
    {renderCardContent()}
  </ScrollView>
)}
```

### Added - Batch Analysis Mode

#### Extractions Enhancement
- Modo de análisis por lotes para múltiples imágenes
- Análisis mejorado de imagen para detectar:
  - `end_time` (hora de finalización)
  - Eventos recurrentes
  - Información de audiencia target

### Enhanced - EventCard Glassmorphic

- Aplicado efecto glassmorphic a `EventCard`
- Animaciones suaves de entrada/salida
- Efecto de profundidad con sombras y bordes sutiles

---

## [0.0.21] - 2026-02-10

### Added
- ⏰ **Hora de Finalización**: Nuevo campo para indicar cuándo termina el evento
  - Picker nativo para iOS/Android con modal estilizado
  - Input HTML time para web
  - Icono naranja distintivo para diferenciar de hora de inicio
  - Campo `end_time` (TIME) en base de datos

- 🔄 **Eventos Recurrentes**: Sistema para eventos que ocurren en múltiples fechas
  - Checkbox "Evento Recurrente" que habilita selector de fechas
  - **Date Picker** para agregar fechas adicionales (no días de la semana)
  - Fechas seleccionadas se muestran como chips removibles
  - Soporte para múltiples fechas por evento
  - Campos `is_recurring` (BOOLEAN) y `recurring_dates` (TEXT[]) en base de datos

- 🗂️ **Multi-Select de Imágenes** (Extractions): Seleccionar múltiples imágenes de un carrusel
  - Botón "Seleccionar" y "Seleccionar Todos" para modo multi-selección
  - Cola de análisis secuencial para evitar rate limits de OpenAI
  - Checkboxes visuales en cada imagen del carrusel

- 💰 **Precio desde Análisis**: El precio detectado por IA ahora se llena automáticamente
  - Parsea valores numéricos de strings como "Q50.00" o "50 quetzales"

### Changed
- 🏷️ **Etiquetas de Hora**: "Hora" renombrado a "Hora Inicio" para mayor claridad
- 🔄 **Reset de Extracción**: Después de guardar borrador, la extracción vuelve a estado 'ready'
- 📱 **Row de Fecha/Hora**: Ahora muestra 3 campos en fila (Fecha, Hora Inicio, Hora Fin)

### Fixed
- 📅 **Fecha un Día Antes**: Corregido problema de timezone al parsear fechas
  - Causa: `new Date("2026-02-13")` se interpretaba como UTC, mostrando día anterior
  - Solución: Parsing manual con `new Date(year, month - 1, day)` para hora local
  - Corregido en 3 lugares: `formatDraftDate`, `openCreateModalWithAnalysis`, `openCreateModalForEdit`

- 🗑️ **Botón Eliminar en Web**: Fixed `Alert.alert` no funcionaba en web
  - Implementado `window.confirm` para plataforma web
  - `Alert.alert` se usa solo en iOS/Android

### Database Migration
```sql
-- Nuevos campos en events y event_drafts
ALTER TABLE events
ADD COLUMN end_time TIME,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurring_dates TEXT[];

ALTER TABLE event_drafts
ADD COLUMN end_time TIME,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurring_dates TEXT[];
```

### Technical Details
```
Modified:
- frontend/app/create.tsx (end time picker, recurring dates UI, form handling)
- frontend/app/extractions.tsx (multi-select, date fixes, price parsing, web delete)
- frontend/src/store/eventStore.ts (new fields in Event interface)
- frontend/src/store/draftStore.ts (new fields, saveDraft, publishDraft)
- frontend/src/services/api.ts (new fields in Event and CreateEventData)

New State Variables (create.tsx):
- selectedEndTime, showEndTimePicker
- isRecurring, recurringDates, showRecurringDatePicker

New Functions:
- onEndTimeChange() - Handler for end time picker
- onRecurringDateChange() - Handler for adding recurring dates
- removeRecurringDate() - Remove a date from recurring list
```

### UI Components
```
Recurring Dates Section:
┌─────────────────────────────────────────┐
│ ☑️ Evento Recurrente                    │
│    Agregar fechas adicionales del evento│
├─────────────────────────────────────────┤
│ [+ Agregar fecha]                       │
│                                         │
│ [Sáb, 15 feb 2026 ✕] [Dom, 22 feb ✕]   │
└─────────────────────────────────────────┘

Time Row:
┌──────────┬──────────┬──────────┐
│  Fecha   │Hora Inicio│ Hora Fin │
│ 📅 15 feb│ 🕐 19:00 │ 🕐 22:00 │
└──────────┴──────────┴──────────┘
```

---

## [0.0.20] - 2026-02-10

### Added
- 📝 **Sistema de Borradores de Eventos**: Nuevo flujo para crear eventos desde extracciones
  - **Tabla `event_drafts`**: Nueva tabla en Supabase para almacenar borradores con RLS
  - **Draft Store** (`draftStore.ts`): Store de Zustand para operaciones CRUD de borradores
    - `fetchDrafts(userId)` - Obtener borradores del usuario
    - `saveDraft(data)` - Guardar nuevo borrador
    - `updateDraft(id, data)` - Actualizar borrador existente
    - `deleteDraft(id)` - Eliminar borrador
    - `publishDraft(id)` - Publicar borrador como evento real
  - **Modal de Crear Borrador**: Formulario completo dentro de extractions.tsx
    - Campos pre-llenados con análisis de IA
    - Selector de categoría (Música, Voluntariado, General)
    - Date/Time pickers nativos para iOS y Android
    - Preview de imagen extraída
    - Campos de precio y URL de registro
  - **Lista de Borradores Pendientes**: Nueva sección en pantalla de extracciones
    - Badge con contador de borradores
    - Cards con thumbnail, título y categoría
    - Acciones: Editar (lápiz), Publicar (send), Eliminar (trash)
  - **Flujo Mejorado**: Seleccionar imagen → Analizar → Modal con formulario → Guardar borrador

### Changed
- 🔄 **Extractions Screen**: Rediseño completo para soportar borradores
  - Sección de borradores arriba de extracciones
  - Al completar análisis, se abre modal de crear borrador automáticamente
  - Las extracciones completadas se pueden reabrir para crear más borradores
  - Header muestra contador de borradores pendientes

### Technical Details
```
New Files:
- frontend/src/store/draftStore.ts (Zustand store for drafts)

Modified:
- frontend/app/extractions.tsx (complete redesign with draft modal and list)

Database Migration:
- create_event_drafts_table (new table with RLS policies)

New Supabase Table:
- event_drafts (id, user_id, extraction_job_id, title, description, category,
  image, date, time, location, organizer, price, registration_form_url,
  bank_name, bank_account_number, source_image_url, created_at, updated_at)
```

### User Flow
```
URL → Extraer imágenes → Por cada imagen:
  ├── Seleccionar → Analizar → Modal con formulario
  ├── Editar campos → "Guardar borrador" (NO publica)
  └── Repetir con otras imágenes

Lista de borradores → Publicar individualmente cuando el usuario quiera
```

---

## [0.0.19] - 2026-02-09

### Fixed
- ⌨️ **Keyboard Covers URL Input**: Fixed keyboard covering the URL input field in Instagram modal
  - Wrapped modal content with `KeyboardAvoidingView`
  - Added proper `paddingBottom: 40` to ensure submit button is visible on iOS

### Changed
- 🔄 **Extraction System Rewrite**: Complete rewrite to support background processing with Supabase persistence
  - Extractions now persist in Supabase `extraction_jobs` table (survives app closure)
  - Polling-based updates every 3 seconds when jobs are in-progress
  - Unified `extractionStore.ts` (removed separate native version)
  - Fire-and-forget API triggers (no more long waits for responses)

### Added
- 🚀 **Fire-and-forget API triggers**: New functions in `api.ts`
  - `triggerExtraction(jobId)` - Start extraction without waiting for response
  - `triggerAnalysis(jobId, imageUrl)` - Start analysis without waiting

- 📡 **Polling System**: New extraction store methods
  - `startPolling(userId)` - Start polling Supabase for updates
  - `stopPolling()` - Stop polling on unmount
  - `fetchExtractions(userId)` - Fetch user's extractions from Supabase
  - `queueExtraction(url, userId)` - Create job in Supabase + trigger backend

### Removed
- `extractionStore.native.ts` - Unified into single `extractionStore.ts`

### Technical Details
```
Modified Files:
- app/create.tsx (KeyboardAvoidingView, userId in queueExtraction)
- app/extractions.tsx (Polling integration, useAuth for userId)
- src/store/extractionStore.ts (Complete rewrite with Supabase + polling)
- src/services/api.ts (Added triggerExtraction, triggerAnalysis)

Deleted Files:
- src/store/extractionStore.native.ts (unified into main store)

Database:
- New `extraction_jobs` table in Supabase with RLS policies
- Auto-updating `updated_at` trigger
```

### Architecture
```
Frontend                  Supabase                 WoWBack
   │                         │                        │
   │ 1. Insert job           │                        │
   │ ─────────────────────► │                        │
   │                         │                        │
   │ 2. Fire-and-forget      │                        │
   │ ─────────────────────────────────────────────► │
   │                         │                        │
   │                         │ 3. Update status/data │
   │                         │ ◄───────────────────── │
   │                         │                        │
   │ 4. Poll for updates     │                        │
   │ ◄───────────────────── │                        │
```

---

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
