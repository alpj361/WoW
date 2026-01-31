# ExtractorT - Guía Completa de Uso

## 📌 ¿Qué es ExtractorT?

ExtractorT es un servicio de extracción de contenido de Instagram que obtiene imágenes, videos y metadata de posts, reels y carruseles usando Playwright y técnicas de scraping avanzadas.

**URL del servicio:** `https://api.standatpd.com`

## 🎯 Mejoras Implementadas (Enero 2026)

### 1. ✅ Fix de Carruseles de Instagram

**Problema anterior:** Solo retornaba 1 imagen de carruseles con múltiples imágenes.

**Solución:** Extracción desde múltiples fuentes de datos de React/Instagram:

- `__PRIVATE_RELAY_STORE__` - Estado de React moderno
- `__additionalDataLoaded` - Datos dinámicos
- Script tags con `xdt_shortcode_media`
- `window._sharedData` - Fallback
- Open Graph meta tags - Última opción

**Resultado:** Ahora extrae **TODAS** las imágenes de un carrusel (6, 10, o más).

### 2. 📊 Logging Detallado

Agregamos logging exhaustivo para debugging:

```python
logger.info(f"🔍 Claves en media_data: {list(media_data.keys())[:20]}")
logger.info(f"📸 Carrusel detectado con {len(edges)} imágenes")
logger.info(f"✅ Carrusel procesado: {len(media_list)} medios extraídos")
```

### 3. 🎬 Soporte para Videos

Detecta y procesa tanto imágenes como videos:

```json
{
  "type": "video",
  "url": "https://...",
  "thumbnail": "https://..."
}
```

## 🚀 Endpoints Disponibles

### 1. POST `/instagram/simple`

Extrae contenido de un post de Instagram (imágenes, videos, carruseles).

**Request:**
```bash
curl -X POST https://api.standatpd.com/instagram/simple \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/p/DUB1s3xCUs1/"
  }'
```

**Response:**
```json
{
  "success": true,
  "url": "https://www.instagram.com/p/DUB1s3xCUs1/",
  "media": [
    {
      "type": "image",
      "url": "https://scontent.cdninstagram.com/..."
    },
    {
      "type": "image",
      "url": "https://scontent.cdninstagram.com/..."
    },
    {
      "type": "video",
      "url": "https://scontent.cdninstagram.com/...",
      "thumbnail": "https://..."
    }
  ],
  "caption": "Texto del post...",
  "likes": 1234,
  "comments": 56,
  "timestamp": "2026-01-30T10:30:00Z"
}
```

### 2. POST `/instagram/batch`

Procesa múltiples URLs de Instagram en batch.

**Request:**
```bash
curl -X POST https://api.standatpd.com/instagram/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.instagram.com/p/ABC123/",
      "https://www.instagram.com/p/DEF456/",
      "https://www.instagram.com/reel/GHI789/"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://www.instagram.com/p/ABC123/",
      "success": true,
      "media": [...]
    },
    {
      "url": "https://www.instagram.com/p/DEF456/",
      "success": false,
      "error": "Post no encontrado"
    }
  ],
  "total": 3,
  "successful": 2,
  "failed": 1
}
```

### 3. GET `/health`

Verifica el estado del servicio.

**Request:**
```bash
curl https://api.standatpd.com/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ExtractorT",
  "version": "2.0",
  "uptime": "5 days, 3 hours"
}
```

## 🧪 Ejemplos de Pruebas

### Ejemplo 1: Carrusel con Múltiples Imágenes

```bash
curl -X POST https://api.standatpd.com/instagram/simple \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/DUB1s3xCUs1/"}' \
  | jq '.media | length'
```

**Resultado esperado:** `6` o más

### Ejemplo 2: Reel de Instagram

```bash
curl -X POST https://api.standatpd.com/instagram/simple \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/"}' \
  | jq '.media[0].type'
```

**Resultado esperado:** `"video"`

### Ejemplo 3: Post Simple (1 Imagen)

```bash
curl -X POST https://api.standatpd.com/instagram/simple \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/SINGLE123/"}' \
  | jq '.media | length'
```

**Resultado esperado:** `1`

## 🔧 Integración con WoW Backend

### Desde WoW Event Analyzer

El servicio WoW Backend ya está integrado con ExtractorT:

```javascript
// event-analyzer/server/services/instagramExtractor.js

async function extractInstagramPost(url) {
  const response = await fetch('https://api.standatpd.com/instagram/simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to extract Instagram content');
  }
  
  return {
    images: data.media.filter(m => m.type === 'image').map(m => m.url),
    videos: data.media.filter(m => m.type === 'video').map(m => m.url),
    caption: data.caption,
    metadata: {
      likes: data.likes,
      comments: data.comments,
      timestamp: data.timestamp
    }
  };
}
```

### Desde WoW Frontend (React Native)

```typescript
import { analyzeInstagramUrl } from '../services/api';

async function handleInstagramUrl(url: string) {
  try {
    const result = await analyzeInstagramUrl(url);
    
    console.log(`Imágenes extraídas: ${result.images.length}`);
    console.log(`Videos extraídos: ${result.videos.length}`);
    
    // Analizar cada imagen con Vision AI
    for (const imageUrl of result.images) {
      const eventData = await analyzeEventImage(imageUrl);
      if (eventData.hasEvent) {
        // Crear evento en WoW
        await createEvent(eventData);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🐛 Troubleshooting

### Error: "Post no encontrado"

**Causa:** URL inválida o post privado/eliminado.

**Solución:** Verificar que la URL sea correcta y el post sea público.

### Error: "Timeout"

**Causa:** Instagram tardó más de 30s en responder.

**Solución:** Reintentar la petición. El timeout está configurado a 30s.

### Error: "Solo retorna 1 imagen de carrusel"

**Causa:** Código antiguo de ExtractorT.

**Solución:** Verificar que ExtractorT esté actualizado con el fix de carruseles (Enero 2026).

### Error: "Blocked by Instagram"

**Causa:** Instagram detectó scraping y bloqueó la IP.

**Solución:** 
- Usar proxies rotativos
- Reducir frecuencia de requests
- Actualizar cookies de sesión

## 📊 Limitaciones

1. **Rate Limiting:** Máximo ~100 requests por minuto
2. **Posts Privados:** No se pueden extraer (requieren autenticación)
3. **Stories:** No soportadas (expiran en 24h)
4. **Lives:** No soportados (contenido en tiempo real)
5. **Cookies:** Requieren actualización periódica para evitar bloqueos

## 🔄 Mantenimiento

### Actualizar Cookies

Si Instagram bloquea las requests, actualizar cookies:

```python
# En ExtractorT/app/routes/instagram_simple.py
INSTAGRAM_COOKIES = [
    {
        "name": "sessionid",
        "value": "NUEVA_SESSION_ID",
        "domain": ".instagram.com"
    }
]
```

### Reiniciar Servicio

Si el servicio está caído:

```bash
# En Railway/Hosting
railway up

# O en Docker local
cd /Users/pj/Desktop/Pulse_Journal/ExtractorT
docker-compose restart
```

### Ver Logs

```bash
# Railway
railway logs

# Docker
docker logs extractort_api -f
```

## 📈 Métricas de Performance

**Tiempos promedio de respuesta:**

- Post simple (1 imagen): ~2-3 segundos
- Carrusel (6-10 imágenes): ~4-6 segundos
- Reel (video): ~5-8 segundos
- Batch (5 URLs): ~15-20 segundos

## 🎯 Roadmap

### Próximas Mejoras

- [ ] Soporte para Instagram Stories
- [ ] Extracción de comentarios destacados
- [ ] Cache de resultados (Redis)
- [ ] Rate limiting inteligente
- [ ] Rotación automática de proxies
- [ ] Webhook para procesamiento asíncrono
- [ ] Soporte para TikTok URLs

## 📝 Changelog

### v2.0 (Enero 2026)
- ✅ Fix de carruseles (múltiples imágenes)
- ✅ Logging detallado
- ✅ Soporte para videos mejorado
- ✅ Extracción desde `__PRIVATE_RELAY_STORE__`

### v1.0 (Diciembre 2025)
- ✅ Extracción básica de Instagram posts
- ✅ Soporte para imágenes y videos
- ✅ Endpoint batch

## 🆘 Soporte

**Repositorio:** ExtractorT (privado)
**URL de producción:** https://api.standatpd.com
**Logs:** Disponibles en Railway dashboard

---

**Última actualización:** 30 de enero de 2026
