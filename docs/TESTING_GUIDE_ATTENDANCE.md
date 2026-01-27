# Guía de Pruebas - Sistema de Asistencia con QR

**Fecha:** 27 de enero de 2026  
**Estado:** Backend completo, Frontend parcialmente implementado

---

## ✅ LO QUE FUNCIONA AHORA

### 1. **Backend - Endpoints API (100% Funcional)**

Todos los endpoints están implementados y funcionando en el backend:

#### ✅ POST `/api/events` - Crear evento
- Ahora acepta el campo `requires_attendance_check: boolean`
- Ejemplo:
```json
{
  "title": "Concierto de Rock",
  "description": "Evento musical",
  "category": "music",
  "user_id": "uuid-del-host",
  "requires_attendance_check": true
}
```

#### ✅ POST `/api/events/:eventId/scan-attendance`
- Escanea QR de usuario para marcar asistencia
- Validaciones completas implementadas
- Ejemplo:
```json
{
  "scanned_user_id": "uuid-del-usuario",
  "host_user_id": "uuid-del-host"
}
```

#### ✅ GET `/api/events/:eventId/attendance-list`
- Obtiene lista de asistentes con estado
- Retorna confirmados vs asistidos

#### ✅ PATCH `/api/events/:eventId/attendance-requirement`
- Activa/desactiva control de asistencia

### 2. **Base de Datos (100% Funcional)**

#### ✅ Tablas creadas:
- `user_qr_codes` - Códigos QR personales de usuarios
- `attended_events` - Con campos de escaneo (scanned_by_host, scanned_at, scanned_by_user_id)
- `events` - Con campo `requires_attendance_check`

#### ✅ Políticas RLS aplicadas:
- Hosts pueden ver QR codes de asistentes
- Hosts pueden actualizar registros de asistencia
- Hosts pueden ver quién guardó sus eventos
- Usuarios solo ven su propia info

#### ✅ Trigger automático:
- Genera QR code automáticamente al crear perfil de usuario

### 3. **Frontend - Componentes (80% Funcional)**

#### ✅ Componentes creados:
- `UserQRCode.tsx` - Muestra QR personal del usuario
- `QRScanner.tsx` - Escáner de cámara para hosts
- Toggle "Llevar asistencia" en `create.tsx`

#### ✅ Funciones API en `api.ts`:
```typescript
scanAttendance(eventId, scannedUserId)
getAttendanceList(eventId)
updateAttendanceRequirement(eventId, requiresAttendance)
```

#### ✅ Perfil de usuario (`profile.tsx`):
- Botón "ESCANEAR" para mostrar QR personal ampliado
- Modal con QR code a pantalla completa

---

## 🧪 PRUEBAS QUE PUEDES HACER AHORA

### **Prueba 1: Crear Evento con Control de Asistencia**

1. Inicia sesión como host
2. Ve a "Crear Evento"
3. Activa el toggle "Soy el Anfitrión"
4. Activa el toggle "Llevar asistencia"
5. Completa los demás campos
6. Crea el evento

**Resultado esperado:** Evento se crea con `requires_attendance_check: true`

---

### **Prueba 2: Ver QR Personal del Usuario**

1. Inicia sesión con cualquier usuario
2. Ve a "Perfil"
3. Presiona el botón morado "ESCANEAR"

**Resultado esperado:** 
- Modal a pantalla completa con QR code
- QR contiene el `user_id` del usuario
- Puedes cerrar el modal con el botón "Cerrar"

---

### **Prueba 3: Endpoints Backend (Postman/cURL)**

#### 3.1 Crear evento con asistencia
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "category": "general",
    "user_id": "TU_USER_ID",
    "requires_attendance_check": true
  }'
```

#### 3.2 Obtener lista de asistencia
```bash
curl http://localhost:3001/api/events/EVENT_ID/attendance-list
```

#### 3.3 Simular escaneo de asistencia
```bash
curl -X POST http://localhost:3001/api/events/EVENT_ID/scan-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "scanned_user_id": "USER_TO_SCAN_ID",
    "host_user_id": "HOST_USER_ID"
  }'
```

**Resultado esperado:**
- Primera vez: 201 Created
- Segunda vez: 200 OK (actualiza registro existente)

---

### **Prueba 4: Verificar Base de Datos**

Puedes verificar en Supabase:

1. **Tabla `user_qr_codes`:**
```sql
SELECT * FROM user_qr_codes LIMIT 5;
```
Deberías ver QR codes generados automáticamente

2. **Tabla `events` con asistencia:**
```sql
SELECT id, title, requires_attendance_check 
FROM events 
WHERE user_id = 'TU_USER_ID';
```

3. **Registros de asistencia:**
```sql
SELECT * FROM attended_events 
WHERE event_id = 'TU_EVENT_ID';
```

---

## ❌ LO QUE FALTA IMPLEMENTAR

### **1. Integración del Escáner en MyEvents (Falta)**

**Lo que falta:**
- Agregar botón "Escanear Asistencia" en eventos del host
- Integrar `QRScanner` component en `myevents.tsx`
- Conectar escaneo con endpoint `scanAttendance()`

**Archivo a modificar:** `frontend/app/myevents.tsx`

**Pseudocódigo:**
```typescript
// En HostedEventCard
<TouchableOpacity onPress={() => openScanner(event.id)}>
  <Text>📱 Escanear Asistencia</Text>
</TouchableOpacity>

// Handler
const openScanner = (eventId) => {
  setSelectedEvent(eventId);
  setScannerVisible(true);
};

// Cuando se escanea un QR
const handleScan = async (scannedData) => {
  const userId = scannedData; // Extraer user_id del QR
  await scanAttendance(selectedEvent, userId);
  Alert.alert('✅', 'Asistencia registrada');
};
```

---

### **2. Lista de Asistencia en MyEvents (Falta)**

**Lo que falta:**
- Vista de lista de asistentes por evento
- Mostrar quién ya fue escaneado
- Contador de asistidos vs confirmados

**Mockup:**
```
Asistentes Confirmados: 25
✅ Asistieron: 18
⏳ Pendientes: 7

[Lista]
✅ Juan Pérez - Escaneado 7:30 PM
✅ María García - Escaneado 7:35 PM
⏳ Pedro López - No asistió
```

---

### **3. Auto-Asistencia en Eventos Gratuitos (Falta)**

**Lógica pendiente:**
- Si evento es gratuito (price = 0 o null)
- Y usuario guarda el evento
- Crear registro automático en `attended_events`
- PERO `scanned_by_host` = false (no escaneado)

**Archivo a modificar:** Backend o trigger en Supabase

---

### **4. Validación de Asistencia en Perfil (Falta)**

**Lo que falta:**
- En eventos con `requires_attendance_check = true`
- Solo mostrar como "Asistido" si `scanned_by_host = true`
- En eventos sin control, mantener lógica actual

---

## 🎯 FLUJO COMPLETO (Cuando todo esté listo)

```
1. HOST crea evento
   └─ Activa "Llevar asistencia" ✅
   
2. USUARIO guarda evento
   └─ Se crea saved_event ✅
   └─ Si gratuito: attended_event (sin escaneo) ❌ FALTA
   
3. DÍA DEL EVENTO
   └─ Usuario llega al evento físico
   └─ Usuario abre perfil > ESCANEAR ✅
   └─ Muestra QR personal ✅
   
4. HOST escanea
   └─ Abre MyEvents > Evento > Escanear ❌ FALTA
   └─ Escanea QR con cámara ✅ (componente listo)
   └─ Backend valida y registra ✅
   
5. USUARIO ve asistencia
   └─ En su perfil aparece como "Asistido" ❌ FALTA LÓGICA
```

---

## 📊 PROGRESO GENERAL

| Componente | Estado | %
|------------|--------|---|
| Backend Endpoints | ✅ Completo | 100% |
| Base de Datos | ✅ Completo | 100% |
| QR Personal Usuario | ✅ Completo | 100% |
| Toggle Crear Evento | ✅ Completo | 100% |
| Componente QRScanner | ✅ Completo | 100% |
| Integración en MyEvents | ❌ Pendiente | 0% |
| Lista de Asistencia | ❌ Pendiente | 0% |
| Auto-asistencia gratuitos | ❌ Pendiente | 0% |
| Validación en Perfil | ❌ Pendiente | 0% |

**Total: ~55% completado**

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### Paso 1: Integrar escáner en MyEvents
```typescript
// En myevents.tsx, agregar:
1. Estado para scanner modal
2. Botón "Escanear" en eventos del host
3. Llamar a scanAttendance() al escanear
4. Mostrar mensaje de éxito
```

### Paso 2: Mostrar lista de asistencia
```typescript
// En myevents.tsx, agregar:
1. Botón "Ver Asistentes"
2. Modal con lista de getAttendanceList()
3. Indicadores visuales (✅/⏳)
```

### Paso 3: Auto-asistencia para eventos gratuitos
```sql
-- Trigger o función en backend
-- Al crear saved_event con evento gratuito
-- Crear attended_event automáticamente
```

### Paso 4: Actualizar lógica de validación
```typescript
// En perfil y lista de eventos
// Verificar requires_attendance_check
// Si true: validar scanned_by_host
// Si false: lógica actual
```

---

## 📝 COMANDOS ÚTILES

### Iniciar Backend
```bash
cd ../WoWBack/event-analyzer
npm start
# Corre en http://localhost:3001
```

### Iniciar Frontend
```bash
cd frontend
npm start
# Presiona 'w' para web
```

### Ver Logs
```bash
# Backend
# Los logs aparecen en consola

# Frontend
# Logs en consola del navegador (F12)
```

---

## 🐛 POSIBLES ERRORES Y SOLUCIONES

### Error: "Database not configured"
**Solución:** Verifica que `.env` en backend tenga credenciales de Supabase

### Error: "Host user ID is required"
**Solución:** El frontend debe enviar `host_user_id` en el request body

### Error: QR no escanea
**Solución:** 
1. Verifica permisos de cámara
2. Asegúrate que el QR esté bien iluminado
3. Verifica que `expo-barcode-scanner` esté instalado

---

## 📞 SOPORTE

- Documentación completa: `/docs/PLAN_ATTENDANCE_TRACKING.md`
- API Docs: `/docs/API_ATTENDANCE_ENDPOINTS.md`
- Migraciones SQL: `/database/migrations/add_attendance_tracking.sql`
