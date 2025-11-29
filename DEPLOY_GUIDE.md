# 🚀 Guía de Deploy - Collaborative Map Space

Esta guía te llevará de 0 a producción en **menos de 10 minutos**.

---

## 📦 Estructura del Proyecto

```
/app/
├── backend-php/          # Backend PHP con Docker
│   ├── Dockerfile        # Configuración Docker
│   ├── docker/           # Archivos de configuración
│   ├── api/              # Endpoints API
│   └── RENDER_DEPLOY.md  # Guía detallada de deploy
├── src/                  # Frontend React Native
├── SETUP_BACKEND.md      # Configuración backend
└── EJEMPLOS_USO.md       # Ejemplos de código
```

---

## ⚡ Quick Start (Deploy Rápido)

### 1. Push a GitHub (1 min)

```bash
cd /app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/collaborative-map.git
git push -u origin main
```

### 2. Deploy Backend a Render (3 min)

1. Ve a [Render.com](https://dashboard.render.com/)
2. New + → Web Service
3. Conecta tu repo
4. Configuración:
   ```
   Root Directory: backend-php
   Environment: Docker
   ```
5. Agrega variables:
   ```
   EXA_API_KEY=tu_key
   SUPADATA_API_KEY=tu_key
   ```
6. Click "Create Web Service"

**Ver guía completa:** [backend-php/RENDER_DEPLOY.md](backend-php/RENDER_DEPLOY.md)

### 3. Configurar App (1 min)

Edita `src/api/backendService.ts`:

```typescript
const API_BASE_URL = 'https://tu-servicio.onrender.com';
```

### 4. Probar App (2 min)

```bash
yarn ios  # o yarn android
```

Ve a **Settings** → Presiona "Probar" → Debería ver **Conectado ✅**

---

## 🧪 Testing Local

### Backend con Docker

```bash
cd backend-php

# Iniciar
docker-compose up

# En segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f
```

Backend en: http://localhost:8000

### Frontend

```bash
# Iniciar Metro
yarn start

# iOS
yarn ios

# Android
yarn android
```

---

## 🔑 API Keys Necesarias

| Servicio | Costo | Uso | Obtener |
|----------|-------|-----|---------|
| **EXA** | Free tier | Búsqueda de eventos | [exa.ai](https://exa.ai) |
| **Supadata** | Variable | Scraping Guatemala.com | [supadata.ai](https://supadata.ai) |
| **Outscraper** | $5/mes | Google Maps (opcional) | [app.outscraper.com](https://app.outscraper.com) |

**Sin Outscraper:** Usa mock data automáticamente ✅

---

## 📱 Probar en Dispositivo

### iOS (Expo Go - Más Fácil)

1. Instala [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. `yarn start`
3. Escanea QR con cámara
4. App se carga automáticamente

### Android (Expo Go)

1. Instala [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. `yarn start`
3. Escanea QR en Expo Go
4. App se carga automáticamente

### Build Nativo

```bash
# iOS (requiere Mac)
yarn ios

# Android
yarn android
```

---

## 🐳 Docker Commands Útiles

```bash
# Build
docker build -t backend-test backend-php/

# Run
docker run -p 8000:80 backend-test

# Test
cd backend-php && ./test-docker.sh

# Logs
docker logs -f container_name

# Stop all
docker-compose down
```

---

## 📊 Endpoints API

Base URL: `https://tu-servicio.onrender.com`

### Health Check
```
GET /api/health
```

### Lugares (Mock Data sin Outscraper)
```
GET /api/places?category=coffee&limit=10
GET /api/places?query=pizza&location=Guatemala
```

### Eventos (Exa Search)
```
GET /api/events?location=Guatemala&category=cultura&limit=10
```

### Guatemala.com (Supadata)
```
GET /api/guatemala?type=events&limit=10
GET /api/guatemala?type=news&limit=10
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno

**Backend** (`.env`):
```env
EXA_API_KEY=tu_key
SUPADATA_API_KEY=tu_key
OUTSCRAPER_API_KEY=tu_key_opcional
CACHE_DURATION=3600
```

**Frontend** (`src/api/backendService.ts`):
```typescript
const API_BASE_URL = 'https://tu-url.onrender.com';
```

### Cache

El backend cachea automáticamente:
- **Lugares**: 1 hora
- **Eventos**: 30 minutos
- **Guatemala.com**: 30 minutos

---

## 🐛 Troubleshooting

### Backend no responde

```bash
# Check status
curl https://tu-servicio.onrender.com/api/health

# Si devuelve "Not Found" → problema de routing
# Solución: Verifica que Render use Docker
```

### "Cold start" lento (Render Free)

**Problema:** Primera request toma ~30 segundos
**Solución:**
1. Usa [UptimeRobot](https://uptimerobot.com) para ping cada 5 min
2. O upgrade a Render Starter ($7/mes)

### App no conecta al backend

```bash
# 1. Verifica URL en backendService.ts
# 2. Prueba en navegador: https://tu-url/api/health
# 3. Verifica CORS headers en respuesta
```

### Build error en Docker

```bash
# Test local
cd backend-php
docker build -t test .

# Ver logs detallados
docker build --no-cache -t test . 2>&1 | tee build.log
```

---

## 📈 Monitoreo Producción

### Render Dashboard

- **Logs**: Ver requests en tiempo real
- **Metrics**: CPU, Memory, Response times
- **Events**: Deploy history

### UptimeRobot (Gratis)

- Monitoreo 24/7
- Alertas por email
- Keep-alive para evitar cold starts

### Papertrail (Logs Persistentes)

- Logs por 7 días gratis
- Búsqueda avanzada
- Alertas personalizadas

---

## 💰 Costos Estimados

### MVP / Testing (Gratis)
- ✅ Render Free
- ✅ Exa Free Tier
- ✅ Supadata Free Tier
- **Total: $0/mes**

### Producción (Básico)
- Render Starter: $7/mes
- Exa API: $10-20/mes
- Supadata: $10-20/mes
- **Total: ~$30-50/mes**

### Producción (Escalado)
- VPS (4GB RAM): $20/mes
- APIs: $30-50/mes
- CDN: $5/mes
- **Total: ~$55-75/mes**

---

## 🎯 Checklist de Deploy

- [ ] Código en GitHub
- [ ] Backend deployed en Render
- [ ] Variables de entorno configuradas
- [ ] Health check funcionando
- [ ] App actualizada con URL correcta
- [ ] Testing en Settings funcionando
- [ ] Lugares aparecen en Discover
- [ ] Mapa muestra marcadores
- [ ] (Opcional) Custom domain configurado
- [ ] (Opcional) Monitoring con UptimeRobot

---

## 📚 Recursos

- [Documentación Render](https://render.com/docs)
- [Guía Exa API](https://docs.exa.ai)
- [Guía Supadata](https://docs.supadata.ai)
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)

---

## 🆘 Soporte

**Problemas comunes:** Ver [Troubleshooting](#-troubleshooting)
**Backend:** Ver `backend-php/RENDER_DEPLOY.md`
**Ejemplos:** Ver `EJEMPLOS_USO.md`

---

¡Tu app estará lista para producción! 🚀
