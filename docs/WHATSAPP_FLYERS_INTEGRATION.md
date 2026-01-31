# WhatsApp Flyers Integration - Sistema de Procesamiento Automático

## 📋 Descripción General

Sistema para recibir flyers de eventos desde WhatsApp, almacenarlos en Supabase, y procesarlos automáticamente con el Flyer Analyzer para crear eventos en WoW.

## 🏗️ Arquitectura

```
WhatsApp → Webhook/API → Supabase Storage → Backend Processor → Flyer Analyzer → Evento Creado
```

### Componentes:

1. **Supabase Storage** - Almacena las imágenes
2. **Tabla `whatsapp_flyers`** - Metadata y estado de procesamiento
3. **Backend Processor** - Worker que procesa flyers pendientes
4. **Flyer Analyzer** - IA que extrae datos del flyer
5. **Events Table** - Eventos creados automáticamente

## 🗄️ Esquema de Base de Datos

### Tabla: `whatsapp_flyers`

```sql
CREATE TABLE whatsapp_flyers (
  id UUID PRIMARY KEY,
  
  -- Metadata
  sender_phone VARCHAR(20),
  sender_name TEXT,
  
  -- Storage
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Processing Status
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: pending, processing, processed, failed, invalid, duplicate
  
  -- Analysis Results
  analysis_result JSONB,
  confidence_score DECIMAL(3,2),
  
  -- Extracted Event Data
  event_name TEXT,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  event_description TEXT,
  
  -- Relations
  created_event_id UUID REFERENCES events(id),
  uploaded_by_user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  whatsapp_message_id TEXT,
  received_at TIMESTAMPTZ,
  file_size_bytes INTEGER,
  mime_type VARCHAR(50),
  
  -- Processing Control
  processing_attempts INTEGER DEFAULT 0,
  last_processing_error TEXT,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Bucket: `whatsapp-flyers`

Bucket público para almacenar las imágenes de flyers.

**Estructura de paths:**
```
whatsapp-flyers/
  ├── YYYY-MM-DD/
  │   ├── {uuid}-original.jpg
  │   └── {uuid}-thumb.jpg
```

## 🔄 Flujo de Procesamiento

### 1. Recepción de Flyer (Webhook/API)

```javascript
// POST /api/whatsapp/flyers
{
  "sender_phone": "+502123456789",
  "sender_name": "Juan Pérez",
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "whatsapp_message_id": "wamid.abc123",
  "received_at": "2026-01-30T15:30:00Z"
}
```

**Proceso:**
1. Validar imagen (formato, tamaño < 10MB)
2. Subir a Supabase Storage (`whatsapp-flyers/YYYY-MM-DD/{uuid}.jpg`)
3. Crear thumbnail (opcional)
4. Insertar registro en `whatsapp_flyers` con status `pending`

### 2. Worker de Procesamiento (Backend)

```javascript
// Cron job o queue processor
async function processWhatsAppFlyers() {
  // 1. Obtener flyers pendientes
  const pending = await supabase
    .from('pending_flyers')
    .select('*')
    .limit(10);
  
  for (const flyer of pending.data) {
    try {
      // 2. Marcar como 'processing'
      await updateFlyerStatus(flyer.id, 'processing');
      
      // 3. Analizar con Flyer Analyzer
      const analysis = await analyzeFlyerImage(flyer.image_url);
      
      // 4. Validar confianza
      if (analysis.confidence < 0.6) {
        await markFlyerFailed(flyer.id, 'Low confidence score');
        continue;
      }
      
      // 5. Crear evento
      const eventId = await processFlyerToEvent(
        flyer.id,
        analysis.result,
        analysis.confidence,
        analysis.eventData
      );
      
      console.log(`✅ Evento creado: ${eventId}`);
      
    } catch (error) {
      await markFlyerFailed(flyer.id, error.message);
    }
  }
}
```

### 3. Análisis con Flyer Analyzer

```javascript
async function analyzeFlyerImage(imageUrl) {
  const response = await fetch('http://event-analyzer:3000/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  
  const data = await response.json();
  
  return {
    confidence: data.confidence,
    result: data, // Full analysis result
    eventData: {
      name: data.name,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location,
      category: data.category || 'General'
    }
  };
}
```

### 4. Creación de Evento

Usando la función SQL `process_flyer_to_event`:

```sql
SELECT process_flyer_to_event(
  'flyer-uuid-here',
  '{"name": "Concierto Rock", ...}'::jsonb,
  0.95,
  '{"name": "Concierto Rock", "date": "2026-02-15", ...}'::jsonb
);
```

## 📡 API Endpoints

### POST `/api/whatsapp/flyers/upload`

Subir un nuevo flyer desde WhatsApp.

**Request:**
```json
{
  "sender_phone": "+502123456789",
  "sender_name": "Juan Pérez",
  "image": "base64_string_or_url",
  "whatsapp_message_id": "wamid.abc123"
}
```

**Response:**
```json
{
  "success": true,
  "flyer_id": "uuid",
  "status": "pending",
  "message": "Flyer received and queued for processing"
}
```

### GET `/api/whatsapp/flyers/:id`

Obtener estado de un flyer.

**Response:**
```json
{
  "id": "uuid",
  "status": "processed",
  "event_name": "Concierto de Rock",
  "event_date": "2026-02-15",
  "confidence_score": 0.95,
  "created_event_id": "event-uuid",
  "analysis_result": { ... }
}
```

### GET `/api/whatsapp/flyers/pending`

Obtener flyers pendientes de procesar (admin only).

### POST `/api/whatsapp/flyers/:id/reprocess`

Reintentar procesamiento de un flyer fallido.

## 🔐 Seguridad (RLS Policies)

### Lectura
- ✅ **Público:** Puede ver flyers con status `processed`
- ✅ **Usuario autenticado:** Puede ver sus propios flyers
- ✅ **Admin:** Puede ver todos los flyers

### Escritura
- ✅ **Usuario autenticado:** Puede subir flyers
- ✅ **Admin:** Puede actualizar cualquier flyer
- ✅ **Service Role:** Control completo (backend processor)

## 🔧 Configuración

### 1. Ejecutar Migración

```bash
# En Supabase Dashboard → SQL Editor
# Copiar y ejecutar: database/migrations/add_whatsapp_flyers.sql
```

### 2. Crear Storage Bucket

```sql
-- En Supabase Dashboard → Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('whatsapp-flyers', 'whatsapp-flyers', true);

-- RLS Policy para storage
CREATE POLICY "Anyone can read flyer images"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-flyers');

CREATE POLICY "Authenticated users can upload flyers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-flyers' AND auth.role() = 'authenticated');
```

### 3. Configurar Worker/Cron Job

**Opción A: Supabase Edge Function**
```typescript
// supabase/functions/process-flyers/index.ts
Deno.serve(async (req) => {
  // Process pending flyers
  const result = await processWhatsAppFlyers();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});

// Cron: Ejecutar cada 5 minutos via pg_cron
SELECT cron.schedule(
  'process-whatsapp-flyers',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-flyers',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;$$
);
```

**Opción B: Backend Externo (Node.js)**
```javascript
// worker.js
const cron = require('node-cron');

// Ejecutar cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Processing WhatsApp flyers...');
  await processWhatsAppFlyers();
});
```

## 📊 Monitoreo

### Consultas Útiles

```sql
-- Estadísticas de procesamiento
SELECT 
  status,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM whatsapp_flyers
GROUP BY status;

-- Flyers fallidos
SELECT 
  id,
  sender_name,
  processing_attempts,
  last_processing_error,
  created_at
FROM whatsapp_flyers
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Eventos creados hoy desde WhatsApp
SELECT 
  wf.sender_name,
  e.title,
  e.date,
  wf.confidence_score
FROM whatsapp_flyers wf
JOIN events e ON e.id = wf.created_event_id
WHERE wf.created_at >= CURRENT_DATE;
```

## 🎯 Casos de Uso

### 1. Usuario Sube Flyer Manualmente

```typescript
// Frontend - React Native
import { supabase } from './supabase';

async function uploadFlyer(imageUri: string) {
  // 1. Subir imagen a storage
  const file = await fetch(imageUri);
  const blob = await file.blob();
  
  const fileName = `${Date.now()}.jpg`;
  const filePath = `${new Date().toISOString().split('T')[0]}/${fileName}`;
  
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('whatsapp-flyers')
    .upload(filePath, blob);
  
  if (uploadError) throw uploadError;
  
  // 2. Crear registro en whatsapp_flyers
  const { data: publicUrl } = supabase
    .storage
    .from('whatsapp-flyers')
    .getPublicUrl(filePath);
  
  const { data, error } = await supabase
    .from('whatsapp_flyers')
    .insert({
      image_url: publicUrl.publicUrl,
      storage_path: filePath,
      uploaded_by_user_id: user.id,
      status: 'pending'
    })
    .select()
    .single();
  
  return data;
}
```

### 2. Webhook de WhatsApp Business API

```javascript
// Backend webhook endpoint
app.post('/webhook/whatsapp', async (req, res) => {
  const { messages } = req.body;
  
  for (const message of messages) {
    if (message.type === 'image') {
      // 1. Descargar imagen de WhatsApp
      const imageBuffer = await downloadWhatsAppMedia(message.id);
      
      // 2. Subir a Supabase Storage
      const filePath = await uploadToSupabase(imageBuffer);
      
      // 3. Crear registro
      await supabaseAdmin
        .from('whatsapp_flyers')
        .insert({
          sender_phone: message.from,
          image_url: getPublicUrl(filePath),
          storage_path: filePath,
          whatsapp_message_id: message.id,
          received_at: new Date(),
          status: 'pending'
        });
      
      // 4. Responder a WhatsApp
      await sendWhatsAppMessage(
        message.from,
        '¡Gracias! Tu flyer será procesado en breve. 🎉'
      );
    }
  }
  
  res.sendStatus(200);
});
```

## ⚠️ Limitaciones y Consideraciones

1. **Rate Limiting:** Limitar uploads a 10 flyers por usuario por día
2. **Tamaño de Imagen:** Máximo 10MB por imagen
3. **Reintentos:** Máximo 3 intentos de procesamiento por flyer
4. **Confidence Score:** Requiere mínimo 0.60 para crear evento automáticamente
5. **Duplicados:** Detectar flyers duplicados por hash de imagen
6. **Storage:** Limpiar imágenes antiguas (>90 días) de flyers procesados

## 🚀 Próximos Pasos

1. ✅ Ejecutar migración SQL en Supabase
2. ✅ Crear bucket `whatsapp-flyers` en Storage
3. 📝 Implementar endpoint `/api/whatsapp/flyers/upload`
4. 🔄 Crear worker de procesamiento
5. 🧪 Probar con flyers de ejemplo
6. 📱 Integrar en frontend de WoW
7. 🔗 Configurar webhook de WhatsApp Business (opcional)

## 📚 Referencias

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Flyer Analyzer API](../event-analyzer/README.md)
