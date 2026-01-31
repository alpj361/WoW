# WhatsApp Webhook API

## 🎯 Descripción

API webhook para recibir imágenes de flyers desde WhatsApp Business y guardarlas automáticamente en Supabase.

**Base URL:** `http://localhost:3001/api/whatsapp` (desarrollo)  
**Production:** `https://tu-dominio.com/api/whatsapp`

---

## 📡 Endpoints

### 1. POST `/api/whatsapp/webhook`

Recibe mensajes de WhatsApp Business API y procesa imágenes de flyers.

**Flujo automático:**
1. ✅ Recibe webhook de WhatsApp
2. ✅ Filtra solo mensajes tipo "image"
3. ✅ Descarga imagen desde WhatsApp
4. ✅ Sube a Supabase Storage (`whatsapp-flyers` bucket)
5. ✅ Inserta registro en tabla `whatsapp_flyers`

**Request Body (WhatsApp Business API format):**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "id": "wamid.HBgNNTIxNTU0ODc4Nzg4NRUCABIYIDNBQjhEOEU3NzRFMzRBMzZBMzY5MTJFODI0Q0YzQTg3AA==",
                "type": "image",
                "from": "5215548787885",
                "timestamp": "1738281600",
                "image": {
                  "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/...",
                  "mime_type": "image/jpeg",
                  "sha256": "...",
                  "id": "123456789"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Flyer received and saved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "flyer": "https://dyvchjqtwhadgybwmbjl.supabase.co/storage/v1/object/public/whatsapp-flyers/2026-01-30/wamid.xxx.jpg",
    "status": "pending",
    "from": "5215548787885",
    "messageId": "wamid.xxx"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

### 2. GET `/api/whatsapp/webhook`

Verificación del webhook (requerido por WhatsApp Business API).

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Token de verificación configurado
- `hub.challenge`: Challenge string para responder

**Example:**
```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wow_flyers_2026&hub.challenge=1234567890
```

**Response:**
```
1234567890
```

---

### 3. GET `/api/whatsapp/flyers/pending`

Obtiene lista de flyers pendientes de procesar.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "flyers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "flyer": "https://...jpg",
      "status": "pending",
      "saved": false,
      "created_at": "2026-01-30T20:30:00Z"
    }
  ]
}
```

---

### 4. PATCH `/api/whatsapp/flyers/:id`

Actualiza el estado de un flyer.

**Request Body:**
```json
{
  "status": "processed",
  "saved": true
}
```

**Response:**
```json
{
  "success": true,
  "flyer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "flyer": "https://...jpg",
    "status": "processed",
    "saved": true,
    "created_at": "2026-01-30T20:30:00Z"
  }
}
```

---

## 🔑 Variables de Entorno Requeridas

Agregar en `/Users/pj/Desktop/WoWBack/event-analyzer/.env`:

```bash
# Supabase (ya existentes)
SUPABASE_URL=https://dyvchjqtwhadgybwmbjl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=tu_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=wow_flyers_2026
```

---

## 🧪 Probar el Endpoint

### 1. Iniciar el servidor

```bash
cd /Users/pj/Desktop/WoWBack/event-analyzer
npm install
npm run dev
```

### 2. Probar con curl (simulando WhatsApp)

```bash
curl -X POST http://localhost:3001/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "test-message-123",
            "type": "image",
            "from": "5215548787885",
            "timestamp": "1738281600",
            "image": {
              "url": "https://picsum.photos/800/1200",
              "mime_type": "image/jpeg",
              "id": "test-image-123"
            }
          }]
        }
      }]
    }]
  }'
```

### 3. Verificar en Supabase

**Storage:**
```sql
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'whatsapp-flyers'
ORDER BY created_at DESC;
```

**Database:**
```sql
SELECT * FROM whatsapp_flyers 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔗 Configurar en WhatsApp Business

### 1. Meta Developer Console

1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app de WhatsApp Business
3. Ve a "WhatsApp" → "Configuration"
4. En "Webhook", click "Edit"

### 2. Configurar Webhook

**Callback URL:**
```
https://tu-dominio.com/api/whatsapp/webhook
```

**Verify Token:**
```
wow_flyers_2026
```

**Webhook Fields:**
- ✅ messages

### 3. Probar

1. Envía una imagen al número de WhatsApp Business
2. Revisa logs del servidor:
   ```bash
   cd /Users/pj/Desktop/WoWBack/event-analyzer
   npm run dev
   ```
3. Deberías ver:
   ```
   📱 WhatsApp webhook received
   📸 Processing image from 5215548787885
   ✅ Image downloaded
   ✅ Image uploaded to storage
   ✅ Flyer record created
   ```

---

## 📊 Estructura de Datos

### Tabla `whatsapp_flyers`

```sql
id          UUID         -- Autogenerado
flyer       TEXT         -- URL pública de la imagen
status      VARCHAR(20)  -- 'pending', 'processed', 'failed'
saved       BOOLEAN      -- Si ya se guardó como evento
created_at  TIMESTAMPTZ  -- Timestamp automático
```

### Storage Bucket `whatsapp-flyers`

**Estructura de carpetas:**
```
whatsapp-flyers/
├── 2026-01-30/
│   ├── wamid.xxx1.jpg
│   ├── wamid.xxx2.jpg
│   └── wamid.xxx3.jpg
├── 2026-01-31/
│   └── wamid.xxx4.jpg
```

---

## 🔄 Flujo Completo

```
WhatsApp User
    ↓ (envía imagen)
WhatsApp Business API
    ↓ (webhook POST)
WoWBack /api/whatsapp/webhook
    ↓ (procesa)
    ├─→ Descarga imagen
    ├─→ Sube a Supabase Storage
    └─→ Inserta en whatsapp_flyers (status: pending)
         ↓
Flyer Analyzer (próximo paso)
    ├─→ Lee flyers pendientes
    ├─→ Analiza con Vision AI
    ├─→ Crea evento
    └─→ Actualiza status: processed, saved: true
```

---

## 🐛 Troubleshooting

### Error: "WHATSAPP_ACCESS_TOKEN not configured"

**Solución:** Agregar en `.env`:
```bash
WHATSAPP_ACCESS_TOKEN=tu_token_de_whatsapp
```

### Error: "Failed to download image"

**Causa:** Token de WhatsApp inválido o expirado.

**Solución:** 
1. Ve a Meta Developer Console
2. Genera nuevo Access Token
3. Actualiza `.env`

### Error: "Upload failed: Bucket not found"

**Solución:** Verificar que el bucket `whatsapp-flyers` existe en Supabase Storage.

### Webhook no recibe mensajes

**Solución:**
1. Verificar URL del webhook en Meta Developer Console
2. Verificar que el servidor esté accesible públicamente
3. Revisar logs: `npm run dev`

---

## 📝 Logs Esperados

```
[2026-01-30T20:30:00.000Z] POST /api/whatsapp/webhook
📱 WhatsApp webhook received
Payload: { entry: [...] }
📨 Message type: image
📸 Processing image from 5215548787885
🔗 Image URL: https://lookaside.fbsbx.com/...
⬇️ Downloading image from WhatsApp...
✅ Image downloaded (125483 bytes, image/jpeg)
☁️ Uploading to Supabase Storage: 2026-01-30/wamid.xxx.jpg
✅ Image uploaded to storage
🔗 Public URL: https://dyvchjqtwhadgybwmbjl.supabase.co/storage/v1/object/public/whatsapp-flyers/2026-01-30/wamid.xxx.jpg
✅ Flyer record created with ID: 550e8400-e29b-41d4-a716-446655440000
🎉 WhatsApp flyer processing complete
```

---

**Fecha de creación:** 30 de enero de 2026  
**Última actualización:** 30 de enero de 2026
