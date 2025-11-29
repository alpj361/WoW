# Collaborative Map Space - PHP Backend

Mini backend PHP para scraping de lugares y eventos en Guatemala.

## 🚀 Quick Start

### 1. Configuración

```bash
cp .env.example .env
```

Edita `.env` y agrega tus API keys:
- **OUTSCRAPER_API_KEY**: Tu key de Outscraper
- **EXA_API_KEY**: Tu key de Exa.ai
- **SUPADATA_API_KEY**: Tu key de Supadata

### 2. Servidor Local (Testing)

```bash
php -S localhost:8000
```

### 3. Deploy a VPS

**Requisitos:**
- PHP 7.4+
- Apache/Nginx con mod_rewrite
- CURL extension enabled

**Apache:**
```apache
<VirtualHost *:80>
    ServerName api.tudominio.com
    DocumentRoot /var/www/backend-php
    
    <Directory /var/www/backend-php>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name api.tudominio.com;
    root /var/www/backend-php;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "apis": {
    "outscraper": true,
    "exa": true,
    "supadata": true
  }
}
```

### Places (Google Maps via Outscraper)
```
GET /api/places?query=coffee&location=Guatemala%20City&category=coffee&limit=20
```

Parameters:
- `query`: Search term (optional if category provided)
- `location`: Location to search (default: Guatemala City)
- `category`: coffee, restaurant, bar, coworking, gym, hotel, shopping
- `limit`: Max results (default: 20, max: 20)

Response:
```json
{
  "success": true,
  "cached": false,
  "data": [
    {
      "id": "ChIJ...",
      "name": "Café de la Paz",
      "category": "coffee",
      "description": "Cozy coffee shop",
      "address": "6a Avenida, Guatemala City",
      "latitude": 14.634915,
      "longitude": -90.506882,
      "rating": 4.5,
      "images": ["..."],
      "contact": "+502...",
      "hours": "Mon-Fri: 7am-8pm"
    }
  ]
}
```

### Events (Exa Search)
```
GET /api/events?location=Guatemala&category=cultura&limit=10
```

Parameters:
- `location`: Location (default: Guatemala)
- `category`: eventos, cultura, deportes, música, arte, comida
- `limit`: Max results (default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_123",
      "name": "Festival de Arte",
      "description": "...",
      "date": "2025-08-15",
      "location": "Antigua Guatemala",
      "url": "https://...",
      "tags": ["arte", "cultura"]
    }
  ]
}
```

### Guatemala.com Data (Supadata)
```
GET /api/guatemala?type=events&limit=10
```

Parameters:
- `type`: events, news, places
- `limit`: Max results (default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "gt_123",
      "name": "Evento Cultural",
      "description": "...",
      "date": "2025-08-20",
      "source": "Guatemala.com"
    }
  ]
}
```

## 🔧 Cache System

El backend implementa un sistema de cache file-based:
- **Places**: 1 hora de cache
- **Events**: 30 minutos de cache
- **Guatemala.com**: 30 minutos de cache

Limpiar cache:
```bash
rm -rf cache/*.json
```

## 📊 Rate Limits

**Outscraper**: 5000 credits/mes (plan básico)
**Exa**: Según tu plan
**Supadata**: Según tu plan

## 🐛 Debugging

Ver logs:
```bash
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
```

Test endpoints:
```bash
curl http://localhost:8000/api/health
curl "http://localhost:8000/api/places?query=coffee&location=Guatemala"
```

## 🔒 Security

- Nunca subas el archivo `.env` al repositorio
- Usa HTTPS en producción
- Configura rate limiting en tu servidor
- Mantén las API keys seguras

## 📦 Dependencies

- PHP 7.4+
- CURL extension
- JSON extension
- FileSystem write permissions para cache/
