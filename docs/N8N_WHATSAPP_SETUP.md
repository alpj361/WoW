# N8N WhatsApp → Supabase Setup (Actualizado)

> **IMPORTANTE**: Esta guía fue actualizada para seguir la documentación oficial de N8N y la API de WhatsApp Business Cloud.

## Cambios Críticos vs Versión Anterior

| Aspecto | Versión Anterior (INCORRECTA) | Versión Actual (CORRECTA) |
|---------|-------------------------------|---------------------------|
| Trigger | Webhook genérico | **WhatsApp Trigger node nativo** |
| Descarga de imagen | `image.url` directo | **2 pasos: media_id → URL temporal → descarga** |
| Campos en DB | Solo `flyer`, `status`, `saved` | **Todos los metadatos del mensaje** |
| Verificación webhook | Manual | **Automática por el nodo WhatsApp Trigger** |

## Flujo Correcto (Según Docs Oficiales)

```
WhatsApp Message
       ↓
[1] WhatsApp Trigger (nativo N8N)
       ↓
[2] Filter: Solo tipo "image"
       ↓
[3] HTTP Request: GET graph.facebook.com/v21.0/{media_id}
    → Obtiene URL temporal (expira en 5 min)
       ↓
[4] HTTP Request: GET {url_temporal}
    → Descarga binario de imagen
       ↓
[5] HTTP Request: POST Supabase Storage
    → Sube imagen al bucket
       ↓
[6] HTTP Request: POST Supabase REST API
    → Inserta registro en tabla whatsapp_flyers
```

---

## Importar Workflow

1. Abrir N8N
2. Click en **"Import from File"**
3. Seleccionar `n8n-whatsapp-flyers-workflow.json`
4. Click **"Import"**

---

## Configurar Credenciales

### 1. WhatsApp Trigger API (Credencial Nativa)

En N8N:
- Click en **"Credentials"** → **"New"**
- Buscar **"WhatsApp Trigger API"** (no "Header Auth")
- Configurar:

| Campo | Valor |
|-------|-------|
| App ID | Tu App ID de Meta Developer |
| Business Account ID | Tu WhatsApp Business Account ID |
| Access Token | Tu Permanent Access Token |

**Dónde conseguir estos valores:**
1. Ve a [Meta Developer Console](https://developers.facebook.com/)
2. Tu App → WhatsApp → API Setup
3. `App ID`: En la URL o panel principal
4. `Business Account ID`: WhatsApp → Getting Started → "WhatsApp Business Account ID"
5. `Access Token`: Generar en API Setup (o crear uno permanente en Business Settings)

### 2. WhatsApp Bearer Token (para descargar media)

En N8N:
- Click en **"Credentials"** → **"New"**
- Buscar **"Header Auth"**
- Configurar:

```
Name: WhatsApp Bearer Token
Header Name: Authorization
Header Value: Bearer TU_WHATSAPP_ACCESS_TOKEN
```

> **Nota**: Este token es el mismo Access Token de WhatsApp, pero necesitas una credencial separada para los nodos HTTP Request.

### 3. Supabase Service Role Auth

En N8N:
- Click en **"Credentials"** → **"New"**
- Buscar **"Header Auth"**

**Problema**: N8N Header Auth solo permite UN header por credencial.

**Solución**: Usar el nodo "HTTP Request" con headers configurados directamente, o crear una credencial con el header más importante (Authorization) y agregar el otro header manualmente en el nodo.

**Opción A - Una credencial con Service Role**:
```
Name: Supabase Service Role Auth
Header Name: Authorization
Header Value: Bearer TU_SUPABASE_SERVICE_ROLE_KEY
```

Luego agregar en cada nodo que use esta credencial:
- Header adicional: `apikey: TU_SUPABASE_ANON_KEY`

**Opción B - Usar HTTP Query Auth**:
Algunos usuarios prefieren pasar el apikey como query param o usar otro tipo de credencial.

**Dónde conseguir las keys:**
- Supabase Dashboard → Settings → API
- `anon key` (public) - Se usa como apikey header
- `service_role key` (secret) - Se usa para Authorization Bearer

---

## Configurar Variables de Entorno

En N8N → Settings → Environment Variables:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
```

---

## Configuración de Cada Nodo

### Nodo 1: WhatsApp Trigger

| Parámetro | Valor |
|-----------|-------|
| Updates | messages |
| Include Name and Number | ✅ Enabled |
| Credentials | WhatsApp Trigger API (la que creaste) |

**Importante**: Cuando activas el workflow, N8N registra automáticamente el webhook en Meta. No necesitas configurar manualmente el callback URL.

### Nodo 2: Filter (Solo Imágenes)

| Parámetro | Valor |
|-----------|-------|
| Condition | `{{ $json.type }}` equals `image` |

**Payload del WhatsApp Trigger**:
```json
{
  "type": "image",
  "from": "521234567890",
  "message_id": "wamid.xxxxx",
  "senderName": "Nombre del Contacto",
  "timestamp": "2026-01-30T12:00:00.000Z",
  "image": {
    "id": "725847798869820",
    "mime_type": "image/jpeg",
    "sha256": "hash..."
  }
}
```

> **NOTA CRÍTICA**: WhatsApp **NO** envía una URL directa. Envía un `media_id` que debes usar para obtener la URL temporal.

### Nodo 3: Obtener URL del Media

| Parámetro | Valor |
|-----------|-------|
| Method | GET |
| URL | `https://graph.facebook.com/v21.0/{{ $json.image.id }}` |
| Authentication | Header Auth → WhatsApp Bearer Token |

**Respuesta esperada**:
```json
{
  "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=...",
  "mime_type": "image/jpeg",
  "sha256": "...",
  "file_size": 12345,
  "id": "725847798869820"
}
```

> **IMPORTANTE**: La URL devuelta expira en **5 minutos**. Debes descargar la imagen inmediatamente.

### Nodo 4: Descargar Imagen

| Parámetro | Valor |
|-----------|-------|
| Method | GET |
| URL | `{{ $json.url }}` |
| Authentication | Header Auth → WhatsApp Bearer Token |
| Response Format | File |

Este nodo descarga el archivo binario de la imagen.

### Nodo 5: Upload a Supabase Storage

| Parámetro | Valor |
|-----------|-------|
| Method | POST |
| URL | `{{ $env.SUPABASE_URL }}/storage/v1/object/whatsapp-flyers/{{ $now.toFormat('yyyy-MM-dd') }}/{{ $('WhatsApp Trigger').item.json.message_id }}.jpg` |
| Authentication | Header Auth → Supabase Service Role Auth |
| Headers | Content-Type: `{{ $('WhatsApp Trigger').item.json.image.mime_type }}` |
| Headers | apikey: `TU_SUPABASE_ANON_KEY` |
| Body | Binary Data (el archivo descargado) |

### Nodo 6: Insertar en DB

| Parámetro | Valor |
|-----------|-------|
| Method | POST |
| URL | `{{ $env.SUPABASE_URL }}/rest/v1/whatsapp_flyers` |
| Authentication | Header Auth → Supabase Service Role Auth |
| Headers | Content-Type: `application/json` |
| Headers | Prefer: `return=representation` |
| Headers | apikey: `TU_SUPABASE_ANON_KEY` |

**Body (JSON)**:
```json
{
  "sender_phone": "{{ $('WhatsApp Trigger').item.json.from }}",
  "sender_name": "{{ $('WhatsApp Trigger').item.json.senderName || 'Unknown' }}",
  "image_url": "{{ $env.SUPABASE_URL }}/storage/v1/object/public/whatsapp-flyers/{{ $now.toFormat('yyyy-MM-dd') }}/{{ $('WhatsApp Trigger').item.json.message_id }}.jpg",
  "storage_path": "whatsapp-flyers/{{ $now.toFormat('yyyy-MM-dd') }}/{{ $('WhatsApp Trigger').item.json.message_id }}.jpg",
  "status": "pending",
  "whatsapp_message_id": "{{ $('WhatsApp Trigger').item.json.message_id }}",
  "received_at": "{{ $('WhatsApp Trigger').item.json.timestamp }}",
  "mime_type": "{{ $('WhatsApp Trigger').item.json.image.mime_type }}",
  "processing_attempts": 0
}
```

---

## Activar el Workflow

1. Click en el toggle para activar el workflow
2. N8N registrará automáticamente el webhook con Meta
3. El status debe cambiar a **"Active"**

> **NOTA**: WhatsApp solo permite UN webhook por app. Si tienes otro workflow activo con WhatsApp Trigger, desactívalo primero.

---

## Probar el Workflow

### 1. Verificar Webhook Registrado

En Meta Developer Console:
- Tu App → WhatsApp → Configuration
- Deberías ver el webhook registrado por N8N

### 2. Enviar Imagen de Prueba

Envía una imagen al número de WhatsApp Business desde cualquier teléfono.

### 3. Verificar Ejecución

En N8N:
- Ve a "Executions"
- Deberías ver una ejecución exitosa con todos los nodos en verde

### 4. Verificar en Supabase

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
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Error: "Media download URL has expired"
**Causa**: Pasaron más de 5 minutos entre obtener la URL y descargar.
**Solución**: Verificar que el workflow se ejecute rápidamente sin delays.

### Error: "Invalid OAuth token"
**Causa**: El Access Token de WhatsApp expiró o es inválido.
**Solución**: Generar un nuevo token en Meta Developer Console.

### Error: "Webhook verification failed"
**Causa**: N8N no pudo verificar el webhook con Meta.
**Solución**:
1. Verificar que las credenciales de WhatsApp Trigger API sean correctas
2. Verificar que la URL de N8N sea accesible públicamente (HTTPS)

### Error: "Bucket not found"
**Causa**: El bucket `whatsapp-flyers` no existe.
**Solución**: Crear el bucket en Supabase Storage:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-flyers', 'whatsapp-flyers', true);
```

### Error: "Permission denied for storage"
**Causa**: Falta la policy de storage o el service_role key es incorrecto.
**Solución**: Verificar el service_role key y crear policy:
```sql
CREATE POLICY "Service role can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-flyers');
```

### Workflow no se activa cuando llega mensaje
**Causas posibles**:
1. Workflow no está activo (toggle apagado)
2. WhatsApp solo permite un webhook por app - otro workflow puede estar registrado
3. El mensaje no es de tipo "image"

---

## Estructura del Payload de WhatsApp

### Webhook de Meta (RAW - NO lo ves directamente)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "John Doe" },
          "wa_id": "521234567890"
        }],
        "messages": [{
          "from": "521234567890",
          "id": "wamid.HBgMNTIxOTk...",
          "timestamp": "1706612400",
          "type": "image",
          "image": {
            "mime_type": "image/jpeg",
            "sha256": "abc123...",
            "id": "725847798869820"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Output del WhatsApp Trigger Node (lo que ves en N8N)
```json
{
  "type": "image",
  "from": "521234567890",
  "message_id": "wamid.HBgMNTIxOTk...",
  "senderName": "John Doe",
  "timestamp": "2026-01-30T12:00:00.000Z",
  "image": {
    "id": "725847798869820",
    "mime_type": "image/jpeg",
    "sha256": "abc123..."
  }
}
```

---

## Checklist Final

- [ ] Workflow importado en N8N
- [ ] Credencial **WhatsApp Trigger API** creada (nativa)
- [ ] Credencial **WhatsApp Bearer Token** creada (Header Auth)
- [ ] Credencial **Supabase Service Role Auth** creada
- [ ] Variable de entorno `SUPABASE_URL` configurada
- [ ] Bucket `whatsapp-flyers` existe en Supabase
- [ ] Tabla `whatsapp_flyers` existe con todas las columnas
- [ ] Workflow activado
- [ ] Prueba con imagen exitosa
- [ ] Verificado en Supabase Storage
- [ ] Verificado en tabla whatsapp_flyers

---

## Referencias Oficiales

- [N8N WhatsApp Trigger Node](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.whatsapptrigger/)
- [N8N WhatsApp Business Cloud Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp/)
- [Meta WhatsApp Business API - Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Meta Webhooks - WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components)

---

**Última actualización:** 30 de enero de 2026
