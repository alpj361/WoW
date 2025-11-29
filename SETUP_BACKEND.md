# 🚀 Configuración del Backend PHP

Esta guía te ayudará a configurar y probar el backend PHP con tus APIs reales.

## 📋 Pre-requisitos

1. **PHP 7.4 o superior**
2. **API Keys**:
   - Outscraper API Key
   - Exa API Key  
   - Supadata API Key

---

## ⚙️ Paso 1: Configurar API Keys

### 1.1 Crear archivo .env

```bash
cd backend-php
cp .env.example .env
```

### 1.2 Editar .env con tus API keys

Abre `backend-php/.env` y agrega tus keys:

```env
# API Keys - REEMPLAZA CON TUS KEYS REALES
OUTSCRAPER_API_KEY=tu_outscraper_key_aqui
EXA_API_KEY=tu_exa_key_aqui
SUPADATA_API_KEY=tu_supadata_key_aqui

# Configuration
CACHE_DURATION=3600
MAX_RESULTS_PER_QUERY=20
DEFAULT_COUNTRY=Guatemala
DEFAULT_LANGUAGE=es
```

### 1.3 Obtener las API Keys

**Outscraper** (Google Maps scraping):
1. Ve a: https://app.outscraper.com/
2. Regístrate (5000 credits gratis)
3. En Dashboard > API: copia tu API key
4. Costo: $5/mes para 5000 credits

**Exa API** (Events search):
1. Ve a: https://exa.ai/ (ex-Metaphor)
2. Sign up y obtén tu API key
3. Pricing: https://exa.ai/pricing

**Supadata** (Web scraping):
1. Ve a: https://supadata.ai/
2. Crea cuenta y obtén API key
3. Pricing según uso

---

## 🧪 Paso 2: Probar Backend Localmente

### 2.1 Iniciar servidor PHP

```bash
cd backend-php
php -S localhost:8000
```

Deberías ver:
```
PHP 7.4.x Development Server (http://localhost:8000) started
```

### 2.2 Probar endpoints

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

**Buscar Lugares:**
```bash
curl "http://localhost:8000/api/places?query=coffee&location=Guatemala%20City&category=coffee&limit=5"
```

**Buscar Eventos:**
```bash
curl "http://localhost:8000/api/events?location=Guatemala&category=cultura&limit=10"
```

**Guatemala.com:**
```bash
curl "http://localhost:8000/api/guatemala?type=events&limit=10"
```

---

## 📱 Paso 3: Conectar React Native App

### 3.1 Para testing local (mismo ordenador)

Si estás usando el simulador iOS o emulador Android en la misma máquina:

Edita `src/api/backendService.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://your-production-domain.com';
```

### 3.2 Para testing en dispositivo físico

Si pruebas en un teléfono real conectado a la misma red WiFi:

1. Obtén la IP de tu ordenador:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. Edita `src/api/backendService.ts`:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://192.168.1.100:8000'  // Tu IP aquí
     : 'https://your-production-domain.com';
   ```

3. Asegúrate que el firewall permita conexiones al puerto 8000

### 3.3 Probar desde la app

1. Abre la app en tu dispositivo/simulador
2. Ve a la pestaña **Settings** (icono de engranaje)
3. Presiona "Probar" en la sección "Estado del Backend"
4. Si todo está bien, verás:
   - Status: Conectado ✅
   - APIs configuradas con puntos verdes

5. Presiona "Probar API de Lugares"
   - Si funciona, verás: "¡Éxito! Se encontraron X lugares"

---

## 🚀 Paso 4: Deploy a VPS (Producción)

### 4.1 Requisitos del servidor

- Ubuntu 20.04+ / Debian 11+
- PHP 7.4+ con extensiones: curl, json, mbstring
- Apache o Nginx
- Dominio apuntando al servidor

### 4.2 Subir archivos

```bash
# Desde tu ordenador
scp -r backend-php user@your-server.com:/var/www/
```

### 4.3 Configurar Apache

```bash
sudo nano /etc/apache2/sites-available/api.conf
```

```apache
<VirtualHost *:80>
    ServerName api.tudominio.com
    DocumentRoot /var/www/backend-php
    
    <Directory /var/www/backend-php>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/api-error.log
    CustomLog ${APACHE_LOG_DIR}/api-access.log combined
</VirtualHost>
```

```bash
sudo a2ensite api.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 4.4 Configurar SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d api.tudominio.com
```

### 4.5 Actualizar app

Edita `src/api/backendService.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'
  : 'https://api.tudominio.com';
```

---

## 🐛 Troubleshooting

### Error: "Backend no disponible"

1. **Verifica que el servidor PHP esté corriendo:**
   ```bash
   ps aux | grep php
   ```

2. **Verifica que el puerto esté abierto:**
   ```bash
   netstat -an | grep 8000
   ```

3. **Revisa los logs:**
   ```bash
   tail -f /var/log/apache2/error.log
   ```

### Error: "Outscraper API key not configured"

1. Verifica que `.env` existe en `backend-php/`
2. Verifica que la key no contiene espacios extras
3. Reinicia el servidor PHP

### Error: "CORS policy"

Si ves errores de CORS en la consola del navegador:

1. Verifica que `.htaccess` existe
2. En Apache, verifica que `mod_headers` está habilitado:
   ```bash
   sudo a2enmod headers
   sudo systemctl restart apache2
   ```

### Cache no funciona

```bash
cd backend-php
chmod 777 cache/
```

---

## 📊 Monitoreo

### Ver requests en tiempo real

```bash
tail -f /var/log/apache2/access.log
```

### Ver uso de cache

```bash
ls -lh backend-php/cache/
```

### Limpiar cache manualmente

```bash
rm backend-php/cache/*.json
```

---

## 💰 Costos Estimados

**Outscraper**: $5-10/mes (5000-10000 credits)
- ~1 credit por búsqueda de lugar
- Con cache, puedes servir 50,000-100,000 requests/mes

**Exa API**: Variable según plan
- Free tier disponible para testing

**Supadata**: Variable según uso
- Pay-as-you-go o planes mensuales

**VPS**: $5-20/mes
- DigitalOcean Droplet: $6/mes (1GB RAM)
- AWS Lightsail: $5/mes
- Linode: $5/mes

**Total estimado**: $15-40/mes para app en producción

---

## 📝 Notas Importantes

1. **Cache**: El backend implementa cache automático de 1 hora para places y 30 min para events
2. **Rate Limiting**: Considera implementar rate limiting en producción
3. **Logs**: Los logs se guardan en `/var/log/apache2/` o `/var/log/nginx/`
4. **Backup**: Haz backup del archivo `.env` y de los archivos PHP
5. **Seguridad**: Nunca subas `.env` a Git

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Prueba los endpoints con `curl` primero
3. Verifica que las API keys sean válidas
4. Asegúrate que el puerto está abierto en el firewall

Para más ayuda, consulta:
- Documentación de Outscraper: https://app.outscraper.com/api-docs
- Documentación de Exa: https://docs.exa.ai/
- Documentación de Supadata: https://docs.supadata.ai/
