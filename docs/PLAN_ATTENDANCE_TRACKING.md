# Plan: Sistema de Asistencia con QR

## Resumen
Implementación de sistema de asistencia para eventos hosteados que requiere escaneo de QR personal del usuario.

## Estados de Asistencia

### Eventos Hosteados con "Llevar asistencia" activado:
1. **Confirmado**: Usuario aprobado para asistir (pago aprobado o evento gratuito guardado)
2. **Asistido**: Usuario físicamente presente (QR escaneado por host en el evento)

### Eventos Públicos (sin host):
- Los usuarios pueden auto-marcarse como asistidos sin requerir escaneo

## Cambios de Base de Datos

### 1. Tabla `events`
```sql
ALTER TABLE events 
ADD COLUMN requires_attendance_check BOOLEAN DEFAULT false;
```

### 2. Tabla `attended_events`
```sql
ALTER TABLE attended_events 
ADD COLUMN scanned_by_host BOOLEAN DEFAULT false,
ADD COLUMN scanned_at TIMESTAMPTZ,
ADD COLUMN scanned_by_user_id UUID REFERENCES auth.users(id);
```

### 3. Tabla `user_qr_codes` (si no existe)
```sql
CREATE TABLE IF NOT EXISTS user_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  qr_code_data TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_qr_codes_user_id ON user_qr_codes(user_id);
CREATE INDEX idx_user_qr_codes_qr_data ON user_qr_codes(qr_code_data);
```

## Componentes Nuevos

### 1. QRScanner.tsx
- Componente modal con cámara para escanear QR
- Valida formato del QR (user_id)
- Marca asistencia mediante API
- Feedback visual de éxito/error

### 2. UserQRCode.tsx
- Muestra QR personal del usuario
- El usuario lo presenta al host en el evento
- QR contiene el user_id

## Flujos de Usuario

### Flujo 1: Evento Hosteado de Pago con Asistencia
1. Host crea evento → activa "Llevar asistencia"
2. Usuario guarda evento y sube comprobante de pago
3. Host aprueba pago → usuario "Confirmado"
4. Usuario llega al evento físico
5. Host abre escáner QR desde lista de asistentes
6. Usuario muestra su QR personal
7. Host escanea → usuario "Asistido"

### Flujo 2: Evento Hosteado Gratuito con Asistencia
1. Host crea evento gratuito → activa "Llevar asistencia"
2. Usuario guarda evento → "Confirmado" automáticamente
3. Usuario llega al evento
4. Host escanea QR → usuario "Asistido"

### Flujo 3: Evento Público
1. Usuario guarda evento
2. Usuario se auto-marca como asistido
3. No requiere escaneo de QR

## APIs Nuevas

### scanUserQR
```typescript
POST /api/events/{eventId}/scan-attendance
Body: { scannedUserId: string }
```
- Valida que el usuario autenticado sea el host del evento
- Valida que el scannedUser esté confirmado para el evento
- Marca attended_events con scanned_by_host=true

### updateAttendanceRequirement
```typescript
PATCH /api/events/{eventId}/attendance-requirement
Body: { requiresAttendance: boolean }
```
- Actualiza campo requires_attendance_check
- Solo el host puede modificar

### getEventAttendanceList
```typescript
GET /api/events/{eventId}/attendance-list
```
- Retorna lista de usuarios con estados:
  - confirmed (boolean)
  - attended (boolean)
  - scanned_by_host (boolean)
  - scanned_at (timestamp)

## Dependencias
```bash
npm install expo-camera react-native-qrcode-svg react-native-svg
```

## Fecha de Implementación
25 de enero, 2026
