# ExtractorT - Fix para Carruseles de Instagram

## 🐛 Problema Identificado

**Síntoma:** ExtractorT solo retornaba 1 imagen de carruseles de Instagram que tienen múltiples imágenes.

**Ejemplo:**
- URL: `https://www.instagram.com/p/DUB1s3xCUs1/`
- Esperado: 6+ imágenes del carrusel
- Obtenido: 1 imagen (la portada "PLANAZOS DE LA SEMANA")

## 🔍 Causa Raíz

Instagram cambió cómo sirve el contenido HTML:

1. **Ya NO incluye `xdt_shortcode_media` en el HTML** cuando detecta ciertos patrones
2. **Solo retorna Open Graph meta tags** (que solo tienen 1 imagen preview)
3. Los datos completos del carrusel **SÍ existen** pero están en el estado de React

**Logs del problema:**
```
⚠️ No se encontró xdt_shortcode_media en ningún script tag
📸 Imagen del post (og:image): 1 imagen extraída
✅ Datos extraídos: 1 medios
```

## ✅ Solución Implementada

### Cambios en `/Users/pj/Desktop/Pulse_Journal/ExtractorT/app/routes/instagram_simple.py`

Agregamos extracción desde múltiples fuentes de datos de React/Instagram:

```javascript
// MÉTODO 1: __PRIVATE_RELAY_STORE__ (React state moderno)
if (window.__PRIVATE_RELAY_STORE__) {
    // Buscar edge_sidecar_to_children con todos los medios del carrusel
    return { __relay_store: store };
}

// MÉTODO 2: __additionalDataLoaded (datos adicionales cargados dinámicamente)
if (window.__additionalDataLoaded) {
    // Buscar xdt_shortcode_media en datos adicionales
}

// MÉTODO 3: Script tags (método original)
// Buscar en <script> tags embebidos

// MÉTODO 4: window._sharedData (fallback clásico)
```

### Logging Detallado

Agregamos logging exhaustivo para debug:

```python
logger.info(f"🔍 Claves en media_data: {list(media_data.keys())[:20]}")
logger.info(f"🔍 Tipo de sidecar: {type(sidecar)}")
logger.info(f"🔍 Número de edges encontrados: {len(edges) if edges else 0}")
logger.info(f"🔍 Procesando imagen {idx + 1}/{len(edges)}")
```

## 📋 Próximos Pasos

### 1. Reiniciar ExtractorT

El código ya está actualizado en el archivo, pero necesitas reiniciar el servicio Docker:

```bash
cd /Users/pj/Desktop/Pulse_Journal/ExtractorT
docker-compose restart
```

O si usas Railway/otro hosting, redeploy el servicio.

### 2. Probar Endpoint

```bash
curl -X POST https://api.standatpd.com/instagram/simple \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/DUB1s3xCUs1/"}' | jq '.media | length'
```

**Resultado esperado:** `6` o más (número de imágenes en el carrusel)

### 3. Revisar Logs

Buscar en los logs de ExtractorT:

```bash
docker logs extractort_api -f
```

**Logs esperados:**
```
✅ Script tag con xdt_shortcode_media encontrado (de __PRIVATE_RELAY_STORE__ o __additionalDataLoaded)
📸 Carrusel detectado con X imágenes
   ✅ 📸 Imagen del carrusel agregada
   ✅ 📸 Imagen del carrusel agregada
   ...
✅ Carrusel procesado: X medios extraídos
```

### 4. Probar en WoW Backend

Una vez que ExtractorT retorne todas las imágenes:

```bash
cd /Users/pj/Desktop/WoWBack
npm run dev
```

Luego probar el endpoint de extracción de URL:

```bash
curl -X POST http://localhost:3000/api/events/extract-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/DUB1s3xCUs1/"}'
```

## 🎯 Validación Final

El fix estará completo cuando:

- ✅ ExtractorT retorne **TODAS** las imágenes del carrusel (6+)
- ✅ WoW Backend analice **TODAS** las imágenes
- ✅ WoW Backend filtre correctamente las portadas genéricas
- ✅ WoW Backend retorne eventos válidos (con fecha/hora específica)

## 📝 Notas Técnicas

### Estructura de Datos

Instagram guarda los carruseles en:
```json
{
  "data": {
    "xdt_shortcode_media": {
      "edge_sidecar_to_children": {
        "edges": [
          {
            "node": {
              "display_url": "https://...",
              "is_video": false
            }
          },
          ...
        ]
      }
    }
  }
}
```

### Fuentes de Datos (en orden de prioridad)

1. **`__PRIVATE_RELAY_STORE__`** - Estado de React más moderno
2. **`__additionalDataLoaded`** - Datos cargados dinámicamente
3. **Script tags con `xdt_shortcode_media`** - Método clásico
4. **`window._sharedData`** - Fallback antiguo
5. **Open Graph meta tags** - Última opción (solo 1 imagen)

## 🔄 Cambio de Arquitectura

**Antes:**
```
Instagram → ExtractorT busca script tags → 1 imagen (og:image)
```

**Ahora:**
```
Instagram → ExtractorT busca estado de React → Todas las imágenes del carrusel
```

## ⚠️ Limitaciones Conocidas

- Si Instagram bloquea el acceso o cookies inválidas, fallback a OG meta tags (1 imagen)
- Si Instagram cambia la estructura de `__PRIVATE_RELAY_STORE__`, puede necesitar ajustes
- Timeout de Playwright configurado a 30s

## 📅 Fecha de Implementación

**Fecha:** 29 de enero de 2026
**Archivo modificado:** `/Users/pj/Desktop/Pulse_Journal/ExtractorT/app/routes/instagram_simple.py`
**Líneas modificadas:** ~390-435 (función de extracción con JavaScript)
