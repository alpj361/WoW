# 🚀 Deploy a Render con Docker

Guía paso a paso para deployar el backend a Render usando Docker.

---

## 📋 Pre-requisitos

1. ✅ Cuenta en [Render.com](https://render.com)
2. ✅ Repositorio en GitHub con el código
3. ✅ API Keys listas (EXA y SUPADATA)

---

## 🔧 PASO 1: Configurar Render Service

### 1.1 Crear Nuevo Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub

### 1.2 Configuración Básica

```
Name: collaborative-map-backend (o mapshub)
Region: Oregon (US West) - o el más cercano a Guatemala
Branch: main
Root Directory: backend-php
```

### 1.3 Build & Deploy

```
Environment: Docker
Dockerfile Path: ./Dockerfile
Docker Build Context: ./
```

**⚠️ IMPORTANTE:** NO pongas ningún Build Command ni Start Command. Docker se encarga de todo.

### 1.4 Plan

Selecciona: **Free** (Gratis)

Características:
- ✅ SSL automático
- ✅ 750 horas/mes
- ⚠️ Se duerme tras 15 min de inactividad
- ⚠️ Cold start: ~30 segundos

---

## 🔐 PASO 2: Configurar Variables de Entorno

Click en **"Advanced"** → **"Add Environment Variable"**

### Variables REQUERIDAS:

```env
EXA_API_KEY
tu_key_de_exa_aqui

SUPADATA_API_KEY
tu_key_de_supadata_aqui
```

### Variables OPCIONALES (ya tienen defaults):

```env
CACHE_DURATION
3600

MAX_RESULTS_PER_QUERY
20

DEFAULT_COUNTRY
Guatemala

DEFAULT_LANGUAGE
es
```

### Variable OPCIONAL (si tienes Outscraper):

```env
OUTSCRAPER_API_KEY
tu_key_aqui
```

Si no la pones, usará mock data automáticamente.

---

## 🚀 PASO 3: Deploy

1. Click **"Create Web Service"**
2. Render comenzará a:
   - ✅ Clonar tu repo
   - ✅ Construir la imagen Docker
   - ✅ Deployar el contenedor
   - ✅ Generar tu URL

⏱️ **Tiempo estimado:** 3-5 minutos

---

## 🌐 PASO 4: Obtener tu URL

Una vez completado, Render te dará una URL:

```
https://tu-servicio.onrender.com
```

Por ejemplo:
```
https://mapshub.onrender.com
```

**¡Guarda esta URL!** La necesitarás para la app móvil.

---

## ✅ PASO 5: Verificar que Funciona

### Test 1: Health Check

Abre en tu navegador:
```
https://tu-servicio.onrender.com/api/health
```

Deberías ver:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "apis": {
      "outscraper": false,
      "exa": true,
      "supadata": true
    }
  }
}
```

### Test 2: Places API

```
https://tu-servicio.onrender.com/api/places?category=coffee&limit=3
```

Deberías ver datos de lugares (mock data si no configuraste Outscraper).

### Test 3: Events API

```
https://tu-servicio.onrender.com/api/events?location=Guatemala&limit=3
```

Deberías ver eventos reales si configuraste Exa correctamente.

---

## 📱 PASO 6: Conectar la App React Native

Edita `src/api/backendService.ts`:

```typescript
const API_BASE_URL = 'https://tu-servicio.onrender.com';
```

Reemplaza con tu URL de Render.

---

## 🔍 Monitoreo en Render

### Ver Logs en Tiempo Real

1. Ve a tu service en Render
2. Click en **"Logs"**
3. Verás:
   - Requests HTTP
   - Errores
   - Cache hits/misses

### Ver Métricas

Click en **"Metrics"**:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🐛 Troubleshooting

### "Service failed to build"

**Problema:** Dockerfile tiene errores

**Solución:**
1. Verifica que todos los archivos estén en el repo
2. Revisa los logs de build en Render
3. Prueba localmente: `docker build -t test .`

### "Service is not responding"

**Problema:** Container no inicia correctamente

**Solución:**
1. Revisa logs en Render
2. Verifica que las variables de entorno estén configuradas
3. Prueba localmente: `docker-compose up`

### "API key not configured"

**Problema:** Variables de entorno no están seteadas

**Solución:**
1. Ve a Environment en Render
2. Verifica que EXA_API_KEY y SUPADATA_API_KEY estén configuradas
3. Click "Save Changes"
4. Re-deploy manual

### "Cold start muy lento"

**Problema:** Limitación del free tier

**Soluciones:**
- ⚡ Upgrade a plan paid ($7/mes) - sin cold starts
- 🔄 Usa un servicio de ping cada 10 minutos
- 🚀 Migra a Railway (mejor free tier)

---

## 🔄 Re-Deploy (Actualizar Código)

Cada vez que hagas `git push`:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render automáticamente:
1. Detecta el cambio
2. Re-construye la imagen Docker
3. Re-deploya sin downtime

---

## 📊 Render vs Otras Plataformas

| Feature | Render Free | Railway Free | Heroku Free |
|---------|-------------|--------------|-------------|
| Precio | $0/mes | $5 crédito/mes | Discontinuado |
| Cold Start | 30s | Menor | - |
| SSL | ✅ Auto | ✅ Auto | - |
| Docker | ✅ Nativo | ✅ Nativo | - |
| Logs | ✅ Tiempo real | ✅ Tiempo real | - |

**Recomendación:** 
- Testing: Render Free ✅
- Producción: Railway ($5/mes) o Render Starter ($7/mes)

---

## 🎯 Siguiente Paso

Una vez deployed exitosamente:

1. ✅ Verifica /api/health
2. ✅ Prueba endpoints con curl
3. ✅ Actualiza backendService.ts con tu URL
4. ✅ Prueba la app en iOS/Android
5. 🎉 ¡Listo!

---

## 🆘 Soporte

Si algo no funciona:

1. **Revisa logs en Render** (pestaña Logs)
2. **Prueba localmente** con Docker: `docker-compose up`
3. **Verifica variables** en Environment
4. **Test endpoints** con curl o Postman

---

## 💡 Tips Pro

### Evitar Cold Starts (Free Tier)

Usa [UptimeRobot](https://uptimerobot.com/) (gratis):
1. Crea monitor HTTP
2. URL: `https://tu-servicio.onrender.com/api/health`
3. Intervalo: 5 minutos
4. Tu backend nunca dormirá 🎉

### Logs Persistentes

Los logs de Render se borran. Para logs persistentes:
1. Integra con [Papertrail](https://www.papertrail.com/) (gratis)
2. Configura en Render: Add-ons → Papertrail

### Custom Domain

Tienes un dominio? (ej: api.tuapp.com)
1. Ve a Settings → Custom Domains
2. Agrega tu dominio
3. Configura DNS según instrucciones
4. SSL automático con Let's Encrypt ✅

---

¡Tu backend estará corriendo 24/7 con Docker! 🐳
