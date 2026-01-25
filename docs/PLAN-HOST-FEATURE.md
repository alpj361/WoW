# Plan: Feature "Anfitrión" (Host) para Eventos

## Resumen
Agregar toggle "Anfitrión" al crear evento. Cuando está activado, el evento se guarda con el ID del usuario como host. Se añade una tercera pestaña "Anfitrión" en Mis Eventos donde el usuario puede ver sus eventos creados y la lista de personas interesadas.

---

## 1. Base de Datos
**No se requieren cambios** - La tabla `events` ya tiene columna `user_id` (uuid, nullable) para almacenar el host.

---

## 2. Backend API
**Archivo:** `/Users/pj/Desktop/WoWBack/event-analyzer/server/routes/events.js`

### 2.1 Modificar POST /api/events
- Agregar `user_id` a los campos aceptados en el body
- Incluir `user_id` en el objeto `eventData` que se inserta

### 2.2 Nuevo: GET /api/events/hosted/:userId
- Retorna eventos donde `user_id` = userId
- Incluye conteo de interesados (de `saved_events`)

```javascript
router.get('/hosted/:userId', async (req, res) => {
    const { userId } = req.params;
    const supabase = getSupabase();

    // Get events where user_id matches
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // For each event, get the attendee count from saved_events
    const eventsWithAttendees = await Promise.all(
        events.map(async (event) => {
            const { count } = await supabase
                .from('saved_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id);

            return { ...event, attendee_count: count || 0 };
        })
    );

    res.json({ success: true, events: eventsWithAttendees });
});
```

### 2.3 Nuevo: GET /api/events/:eventId/attendees
- Retorna lista de usuarios que guardaron el evento
- Incluye: nombre, avatar, fecha de guardado

```javascript
router.get('/:eventId/attendees', async (req, res) => {
    const { eventId } = req.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('saved_events')
        .select(`
            id,
            saved_at,
            profiles:user_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('event_id', eventId)
        .order('saved_at', { ascending: false });

    res.json({ success: true, attendees: data });
});
```

---

## 3. Frontend - API Service
**Archivo:** `/Users/pj/Desktop/Wow/frontend/src/services/api.ts`

```typescript
// Agregar a CreateEventData
export interface CreateEventData {
    // ... campos existentes ...
    user_id?: string | null;  // NUEVO: Host user ID
}

export interface HostedEvent extends Event {
    attendee_count: number;
}

export interface Attendee {
    id: string;
    saved_at: string;
    profiles: {
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
}

// Nuevas funciones
export async function fetchHostedEvents(userId: string): Promise<HostedEvent[]> {
    const response = await api.get(`/events/hosted/${userId}`);
    return response.data.events;
}

export async function fetchEventAttendees(eventId: string): Promise<Attendee[]> {
    const response = await api.get(`/events/${eventId}/attendees`);
    return response.data.attendees;
}
```

---

## 4. Frontend - Store
**Archivo:** `/Users/pj/Desktop/Wow/frontend/src/store/eventStore.ts`

```typescript
// Agregar al estado
hostedEvents: HostedEventData[];

// Nuevas acciones
fetchHostedEvents: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const events = await api.fetchHostedEvents(user.id);
    set({ hostedEvents: events.map(event => ({ event })) });
},

fetchEventAttendees: async (eventId: string) => {
    return await api.fetchEventAttendees(eventId);
},

// Modificar createEvent para pasar user_id
createEvent: async (eventData) => {
    const newEvent = await api.createEvent({
        // ... campos existentes ...
        user_id: eventData.user_id || undefined,
    });
    // ...
},
```

---

## 5. Frontend - Pantalla Crear Evento
**Archivo:** `/Users/pj/Desktop/Wow/frontend/app/create.tsx`

### Cambios:
1. Importar `useAuth` para obtener `user.id`
2. Estado: `const [isHost, setIsHost] = useState(false)`
3. UI: Toggle "Soy el Anfitrión"
4. En `handleSubmit`: pasar `user_id: isHost ? user.id : null`

### Toggle UI:
```tsx
<View style={styles.hostToggleContainer}>
  <View style={styles.hostToggleInfo}>
    <Ionicons name="person-circle" size={24} color="#8B5CF6" />
    <View>
      <Text style={styles.hostToggleTitle}>Soy el Anfitrion</Text>
      <Text style={styles.hostToggleSubtitle}>
        Gestiona los asistentes de tu evento
      </Text>
    </View>
  </View>
  <TouchableOpacity
    style={[styles.toggleButton, isHost && styles.toggleButtonActive]}
    onPress={() => setIsHost(!isHost)}
  >
    <View style={[styles.toggleKnob, isHost && styles.toggleKnobActive]} />
  </TouchableOpacity>
</View>
```

---

## 6. Frontend - Pantalla Mis Eventos
**Archivo:** `/Users/pj/Desktop/Wow/frontend/app/myevents.tsx`

### 6.1 Tercera Pestaña
- Tab type: `'saved' | 'attended' | 'hosted'`
- Color accent: `#F59E0B` (ámbar)
- Icono: `person-circle`
- Texto: "Anfitrión (N)"

### 6.2 Renderizado de Eventos Hosted
- Card similar a saved/attended
- Badge: "{N} interesados" con icono `people`
- Botón: "Ver Lista" para abrir modal

### 6.3 Modal de Asistentes
- Lista de personas que guardaron el evento
- Muestra: avatar, nombre, fecha guardado
- Diseño: slide-up desde abajo

---

## 7. Secuencia de Implementación

1. **Backend** - Modificar POST y agregar 2 endpoints nuevos
2. **API Service** - Interfaces y funciones fetch
3. **Store** - Estado y acciones para hosted events
4. **Create Screen** - Toggle y lógica de submit
5. **MyEvents Screen** - Tab, renderizado y modal

---

## 8. Verificación

1. Crear evento con toggle "Anfitrión" ON
2. Verificar en DB que `user_id` se guardó
3. Ir a Mis Eventos > pestaña Anfitrión
4. Ver el evento creado con contador de interesados
5. Con otro usuario, guardar ese evento (swipe right)
6. Volver al host, tocar "Ver Lista"
7. Verificar que aparece el usuario interesado

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `WoWBack/.../routes/events.js` | user_id en POST, 2 endpoints nuevos |
| `frontend/src/services/api.ts` | Interface + 2 funciones fetch |
| `frontend/src/store/eventStore.ts` | hostedEvents state + acciones |
| `frontend/app/create.tsx` | Toggle UI + lógica submit |
| `frontend/app/myevents.tsx` | 3ra tab + modal asistentes |

---

## Diseño Visual

### Colores
- Host/Anfitrión accent: `#F59E0B` (ámbar)
- Toggle OFF: `#374151`
- Toggle ON: `#8B5CF6`

### Toggle
- Ancho: 50px, Alto: 28px
- Knob: 24px círculo blanco
- Animación: slide left/right
