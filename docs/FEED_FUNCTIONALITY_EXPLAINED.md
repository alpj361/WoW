# 📋 Explicación del Funcionamiento del Feed

## 🎯 Características Implementadas

### 1. ✅ Eventos Denegados (Swipe Left)

**¿Cómo funciona?**
Cuando deslizas un evento hacia la **izquierda** (o presionas el botón ❌), el evento se marca como "denegado" y **NO volverá a aparecer en tu feed por 48 horas**.

**Implementación técnica:**

```typescript
// En eventStore.ts - líneas 107-119
fetchEvents: async (category?: string) => {
  // ... obtener eventos del backend
  
  // Filtrar eventos denegados en las últimas 48 horas
  const now = new Date();
  const deniedEventIds = new Set(
    deniedEvents
      .filter(d => {
        const deniedDate = new Date(d.denied_at);
        const hoursDiff = (now.getTime() - deniedDate.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 48; // Solo los últimos 48h
      })
      .map(d => d.event_id)
  );

  // Excluir eventos denegados del feed
  const filteredEvents = events.filter(event =>
    !savedEventIds.has(event.id) && !deniedEventIds.has(event.id)
  );
}
```

**Base de datos:**
- Tabla: `denied_events`
- Columnas: `id`, `user_id`, `event_id`, `denied_at`
- Cuando niegas un evento, se guarda en esta tabla
- El filtro revisa la fecha `denied_at` y solo oculta eventos de las últimas 48 horas

**Comportamiento:**
- ✅ Los eventos denegados NO aparecen en el feed
- ⏱️ Después de 48 horas, pueden volver a aparecer
- 🔄 Se cargan al iniciar la app: `fetchDeniedEvents()`

---

### 2. 🚫 Filtro de Eventos Pasados

**¿Cómo funciona?**
Los eventos con fecha **anterior a hoy** ya NO aparecen en el feed principal. Solo se muestran eventos futuros o del día actual.

**Implementación técnica:**

```javascript
// En backend: event-analyzer/server/routes/events.js
router.get('/', async (req, res) => {
  // Obtener fecha actual en zona horaria de Guatemala (UTC-6)
  const today = new Date();
  today.setHours(today.getHours() - 6);
  const todayStr = today.toISOString().split('T')[0]; // "2026-01-31"

  // Obtener todos los eventos de la base de datos
  const { data, error } = await query;

  // Filtrar eventos pasados
  const filteredData = data.filter(event => {
    if (!event.date) return true; // Mantener eventos sin fecha
    return event.date >= todayStr; // Solo eventos de hoy o futuros
  });

  console.log(`[EVENTS] Filtered ${data.length - filteredData.length} past events`);
  
  res.json({ success: true, events: filteredData });
});
```

**Comportamiento:**
- ✅ Eventos sin fecha (`date: null`) → Se muestran siempre
- ✅ Eventos con fecha ≥ hoy → Se muestran
- ❌ Eventos con fecha < hoy → **NO se muestran**

---

### 3. 🖼️ Imágenes en "Mis Eventos"

**Estado actual:**
El código de `myevents.tsx` **SÍ está preparado** para mostrar imágenes:

```tsx
// En myevents.tsx - líneas 649-651
{event.image ? (
  <Image source={{ uri: event.image }} style={styles.cardImage} />
) : (
  <View style={styles.cardIconContainer}>
    <Ionicons name={icon as any} size={40} color="rgba(255,255,255,0.6)" />
  </View>
)}
```

**¿Por qué no se ven las imágenes?**

Posibles causas:

1. **Los eventos en la BD no tienen imagen**
   - Verificar: `SELECT id, title, image FROM events WHERE image IS NOT NULL;`
   - Los eventos pueden tener `image: null`

2. **La URL de la imagen no es válida**
   - Debe ser una URL completa (http://.../imagen.jpg)
   - O base64: `data:image/jpeg;base64,/9j/4AA...`

3. **Eventos creados antes de agregar imágenes**
   - Los eventos antiguos no tienen campo `image`
   - Solo los nuevos eventos (creados con flyer) tienen imagen

**Solución:**
```sql
-- Verificar eventos con imagen
SELECT id, title, LEFT(image, 50) as image_preview 
FROM events 
WHERE image IS NOT NULL 
ORDER BY created_at DESC;

-- Si no hay eventos con imagen, necesitas crear eventos nuevos
-- usando la función de "Crear con URL" o "Subir Flyer"
```

---

## 📊 Flujo Completo del Feed

```
1. Usuario abre la app
   ↓
2. Se cargan eventos denegados (fetchDeniedEvents)
   ↓
3. Se cargan eventos guardados (fetchSavedEvents)
   ↓
4. Se obtienen eventos del backend (fetchEvents)
   ↓
5. Backend filtra eventos pasados
   ↓
6. Frontend filtra:
   - Eventos ya guardados (liked)
   - Eventos denegados (últimas 48h)
   ↓
7. Se muestra el feed filtrado
```

---

## 🔧 Verificación y Debugging

### Para verificar eventos denegados:

```sql
-- Ver tus eventos denegados
SELECT 
  de.denied_at,
  e.title,
  EXTRACT(EPOCH FROM (NOW() - de.denied_at))/3600 as hours_ago
FROM denied_events de
JOIN events e ON e.id = de.event_id
WHERE de.user_id = 'TU_USER_ID'
ORDER BY de.denied_at DESC;
```

### Para verificar filtro de fechas:

```bash
# En los logs del backend verás:
[EVENTS] Filtered 5 past events

# Esto indica que 5 eventos fueron filtrados por tener fecha pasada
```

### Para verificar imágenes:

```sql
-- Contar eventos con y sin imagen
SELECT 
  COUNT(CASE WHEN image IS NOT NULL THEN 1 END) as con_imagen,
  COUNT(CASE WHEN image IS NULL THEN 1 END) as sin_imagen
FROM events;
```

---

## 📝 Resumen

| Característica | Estado | Funcionamiento |
|---------------|--------|----------------|
| ✅ Eventos denegados | **Implementado** | No aparecen por 48 horas |
| ✅ Filtro de fecha | **Implementado** | Solo eventos futuros |
| ⚠️ Imágenes en myevents | **Código listo** | Depende de datos en BD |

---

## 🎨 Mejoras Futuras

1. **Configuración de tiempo de ocultación**
   - Permitir al usuario elegir: 24h, 48h, 7 días, permanente

2. **Visualización de eventos pasados**
   - Agregar opción "Ver eventos pasados" en settings

3. **Sincronización de imágenes**
   - Verificar que todos los eventos tengan imagen
   - Generar placeholder si no hay imagen

---

**Última actualización:** 31 de enero, 2026
