# WhatsApp Flyers - Guía de Inicio Rápido

## ✅ Archivos Creados

1. **`database/migrations/add_whatsapp_flyers.sql`** - Migración SQL completa
2. **`docs/WHATSAPP_FLYERS_INTEGRATION.md`** - Documentación técnica detallada
3. **Este archivo** - Guía de implementación paso a paso

## 🚀 Implementación en 5 Pasos

### Paso 1: Ejecutar Migración en Supabase

1. Ir a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navegar a **SQL Editor**
3. Abrir el archivo `database/migrations/add_whatsapp_flyers.sql`
4. Copiar todo el contenido
5. Pegarlo en el SQL Editor
6. Click en **Run** ✅

**Resultado esperado:**
```
Success. No rows returned
```

Esto creará:
- ✅ Tabla `whatsapp_flyers`
- ✅ Índices de performance
- ✅ Políticas RLS (seguridad)
- ✅ Funciones SQL helper
- ✅ Vista `pending_flyers`

### Paso 2: Crear Storage Bucket

1. En Supabase Dashboard → **Storage**
2. Click en **New bucket**
3. Configurar:
   - **Name:** `whatsapp-flyers`
   - **Public bucket:** ✅ Yes
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`

4. Crear las políticas de storage (SQL Editor):

```sql
-- Permitir lectura pública
CREATE POLICY "Anyone can read flyer images"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-flyers');

-- Permitir subida autenticada
CREATE POLICY "Authenticated users can upload flyers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-flyers' AND auth.role() = 'authenticated');

-- Permitir actualización de propios archivos
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'whatsapp-flyers' AND auth.uid()::text = owner);

-- Permitir eliminación de propios archivos
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-flyers' AND auth.uid()::text = owner);
```

### Paso 3: Verificar Configuración

Ejecutar en SQL Editor para verificar:

```sql
-- Verificar tabla
SELECT COUNT(*) FROM whatsapp_flyers;
-- Debe retornar: 0

-- Verificar vista
SELECT * FROM pending_flyers;
-- Debe retornar: 0 rows

-- Verificar funciones
SELECT proname FROM pg_proc 
WHERE proname IN ('process_flyer_to_event', 'mark_flyer_failed');
-- Debe retornar: 2 rows

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'whatsapp-flyers';
-- Debe retornar: 1 row con name='whatsapp-flyers', public=true
```

### Paso 4: Obtener Credenciales

Necesitarás estas variables de entorno:

```bash
# Supabase Dashboard → Settings → API

# URL del proyecto
SUPABASE_URL=https://xxx.supabase.co

# Anon Key (para frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (para backend - ¡NO compartir!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 5: Implementar Upload Endpoint (Ejemplo)

Crear archivo: `backend/routes/whatsapp-flyers.js`

```javascript
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const router = express.Router();

// Configurar Supabase (usar service_role para bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar multer para memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/whatsapp/flyers/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { sender_phone, sender_name, whatsapp_message_id } = req.body;
    const imageFile = req.file;
    
    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // 1. Generar path único
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const filePath = `${date}/${fileName}`;
    
    // 2. Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('whatsapp-flyers')
      .upload(filePath, imageFile.buffer, {
        contentType: imageFile.mimetype,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
    
    // 3. Obtener URL pública
    const { data: publicUrlData } = supabase
      .storage
      .from('whatsapp-flyers')
      .getPublicUrl(filePath);
    
    // 4. Crear registro en whatsapp_flyers
    const { data: flyerData, error: insertError } = await supabase
      .from('whatsapp_flyers')
      .insert({
        sender_phone,
        sender_name,
        image_url: publicUrlData.publicUrl,
        storage_path: filePath,
        whatsapp_message_id,
        received_at: new Date().toISOString(),
        file_size_bytes: imageFile.size,
        mime_type: imageFile.mimetype,
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create flyer record' });
    }
    
    res.json({
      success: true,
      flyer_id: flyerData.id,
      status: 'pending',
      message: 'Flyer received and queued for processing',
      image_url: publicUrlData.publicUrl
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/whatsapp/flyers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_flyers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Flyer not found' });
    
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/whatsapp/flyers/pending
router.get('/status/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_flyers')
      .select('*');
    
    if (error) throw error;
    
    res.json({
      count: data.length,
      flyers: data
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Usar en tu server:

```javascript
// server.js
const whatsappFlyers = require('./routes/whatsapp-flyers');
app.use('/api/whatsapp/flyers', whatsappFlyers);
```

## 🧪 Probar la Implementación

### 1. Test con cURL

```bash
# Subir un flyer de prueba
curl -X POST http://localhost:3000/api/whatsapp/flyers/upload \
  -F "image=@/path/to/flyer.jpg" \
  -F "sender_phone=+502123456789" \
  -F "sender_name=Juan Pérez" \
  -F "whatsapp_message_id=test-123"

# Respuesta esperada:
{
  "success": true,
  "flyer_id": "uuid-here",
  "status": "pending",
  "message": "Flyer received and queued for processing",
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/whatsapp-flyers/..."
}
```

### 2. Verificar en Supabase

```sql
-- Ver flyers subidos
SELECT 
  id,
  sender_name,
  status,
  created_at
FROM whatsapp_flyers
ORDER BY created_at DESC;

-- Ver flyers pendientes
SELECT * FROM pending_flyers;
```

### 3. Test Frontend (React Native)

```typescript
import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

async function uploadFlyerFromGallery() {
  // 1. Seleccionar imagen
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return;

  // 2. Convertir a blob
  const response = await fetch(result.assets[0].uri);
  const blob = await response.blob();

  // 3. Subir a Supabase Storage
  const fileName = `${Date.now()}.jpg`;
  const filePath = `${new Date().toISOString().split('T')[0]}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('whatsapp-flyers')
    .upload(filePath, blob);

  if (uploadError) {
    alert('Error subiendo imagen: ' + uploadError.message);
    return;
  }

  // 4. Crear registro
  const { data: publicUrl } = supabase
    .storage
    .from('whatsapp-flyers')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('whatsapp_flyers')
    .insert({
      image_url: publicUrl.publicUrl,
      storage_path: filePath,
      uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    alert('Error creando registro: ' + error.message);
    return;
  }

  alert('¡Flyer subido! ID: ' + data.id);
}
```

## 📊 Monitoreo y Administración

### Dashboard de Admin (SQL Queries)

```sql
-- Estadísticas generales
SELECT 
  status,
  COUNT(*) as total,
  AVG(confidence_score) as avg_confidence,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM whatsapp_flyers
GROUP BY status;

-- Flyers de hoy
SELECT 
  sender_name,
  event_name,
  status,
  confidence_score,
  created_at
FROM whatsapp_flyers
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- Tasa de éxito
SELECT 
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'processed') / COUNT(*),
    2
  ) as success_rate_percent
FROM whatsapp_flyers
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

## 🔄 Siguiente: Implementar Worker de Procesamiento

Ver documentación completa en: **`docs/WHATSAPP_FLYERS_INTEGRATION.md`**

Secciones importantes:
- **Worker de Procesamiento** - Cómo procesar flyers pendientes
- **Integración con Flyer Analyzer** - Analizar imágenes con IA
- **Webhook de WhatsApp** - Recibir flyers automáticamente

## 📝 Checklist de Implementación

- [ ] Ejecutar migración SQL
- [ ] Crear bucket `whatsapp-flyers`
- [ ] Configurar políticas de storage
- [ ] Verificar configuración (queries de test)
- [ ] Implementar endpoint de upload
- [ ] Probar con imagen de prueba
- [ ] Verificar registro en Supabase
- [ ] Implementar worker de procesamiento (siguiente paso)
- [ ] Integrar con Flyer Analyzer
- [ ] Agregar UI en frontend

## ⚡ Tips

1. **Rate Limiting:** Agregar límite de 10 uploads por usuario por día
2. **Validación:** Validar que la imagen sea realmente un flyer (no selfies, etc.)
3. **Duplicados:** Usar hash de imagen para detectar duplicados
4. **Cleanup:** Crear job para eliminar imágenes antiguas (>90 días)
5. **Notificaciones:** Notificar al usuario cuando su flyer sea procesado

## 🆘 Troubleshooting

**Error: "new row violates row-level security policy"**
- Asegúrate de usar `service_role_key` en el backend
- Verifica que las políticas RLS estén creadas correctamente

**Error: "storage bucket not found"**
- Verifica que el bucket `whatsapp-flyers` esté creado
- Verifica que el bucket sea público

**Error: "413 Payload Too Large"**
- Verifica el límite de tamaño en multer (10MB)
- Verifica el límite en Supabase Storage bucket

## 📚 Recursos

- [Documentación Completa](./WHATSAPP_FLYERS_INTEGRATION.md)
- [Migración SQL](../database/migrations/add_whatsapp_flyers.sql)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
