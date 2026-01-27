# 📱 Guía para Ejecutar WOW en Dispositivo iOS Físico

## ✅ Lo que YA está Configurado

- ✅ Iconos de la app
- ✅ Permisos para cámara, galería y micrófono
- ✅ Bundle Identifier: `com.wow.events`
- ✅ Proyecto iOS nativo generado
- ✅ CocoaPods instalado
- ✅ Plugins nativos configurados

## ⚠️ Lo que FALTA para Dispositivo Físico

### 1. **Certificado de Desarrollo de Apple**

Para ejecutar en un iPhone/iPad físico, necesitas:

#### Opción A: Desarrollo Local (GRATIS) ✅ Recomendado

```bash
# 1. Abre el proyecto en Xcode
cd /Users/pj/Desktop/Wow/frontend/ios
open WowEvents.xcworkspace

# 2. En Xcode:
# - Selecciona el proyecto "WowEvents" en el navegador izquierdo
# - Ve a "Signing & Capabilities"
# - En "Team" selecciona tu Apple ID (o añádelo)
# - Marca "Automatically manage signing"
# - Cambia Bundle Identifier si es necesario
```

**Pasos detallados:**
1. Conecta tu iPhone con cable USB
2. Confía en la computadora cuando te lo pida
3. En Xcode, selecciona tu dispositivo en la barra superior
4. Añade tu Apple ID:
   - Xcode → Settings → Accounts → "+"
   - Inicia sesión con tu Apple ID
5. En "Signing & Capabilities":
   - Team: Selecciona tu cuenta personal
   - Bundle Identifier: Debe ser único (ej: `com.tunombre.wow`)
6. Presiona ⌘R para ejecutar

**En tu iPhone:**
- Primero dará error de "Desarrollador no confiable"
- Ve a: Ajustes → General → VPN y administración de dispositivos
- Toca tu Apple ID → Confiar

#### Opción B: Cuenta de Desarrollador Apple ($99/año)

Si planeas publicar en App Store:
```
1. Regístrate en: https://developer.apple.com
2. Paga $99/año
3. Crea certificados y perfiles
4. Configura en Xcode
```

### 2. **Configuración de Red Local**

Para que funcione el backend local:

```bash
# En tu Mac, obtén tu IP local
ipconfig getifaddr en0

# Ejemplo de salida: 192.168.1.100
```

Luego actualiza el archivo `.env`:
```bash
cd /Users/pj/Desktop/Wow/frontend

# Edita .env para usar tu IP local en lugar de localhost
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

**Importante:** Tu iPhone y Mac deben estar en la misma red WiFi.

### 3. **Ejecutar el Backend**

```bash
# Terminal 1 - Backend
cd /Users/pj/Desktop/WoWBack
npm start

# Terminal 2 - Frontend
cd /Users/pj/Desktop/Wow/frontend
npx expo run:ios --device
```

## 🚀 Guía Paso a Paso Completa

### Paso 1: Preparar el Proyecto

```bash
cd /Users/pj/Desktop/Wow/frontend

# Si aún no has hecho prebuild
npx expo prebuild --platform ios

# Abrir en Xcode
cd ios
open WowEvents.xcworkspace
```

### Paso 2: Configurar Signing en Xcode

1. **En el navegador izquierdo**, click en el proyecto "WowEvents" (ícono azul)
2. **En TARGETS**, selecciona "WowEvents"
3. **Pestaña "Signing & Capabilities"**:
   - ✅ Marca "Automatically manage signing"
   - Team: Añade tu Apple ID si no aparece
   - Bundle Identifier: `com.tunombre.wow` (debe ser único)

### Paso 3: Conectar tu iPhone

```bash
# 1. Conecta iPhone con cable USB
# 2. Desbloquea el iPhone
# 3. Toca "Confiar" cuando aparezca el mensaje
# 4. En Xcode, selecciona tu iPhone en la barra superior
```

### Paso 4: Ejecutar la App

```bash
# Opción A: Desde Xcode
# Presiona el botón ▶ o ⌘R

# Opción B: Desde terminal
cd /Users/pj/Desktop/Wow/frontend
npx expo run:ios --device
```

### Paso 5: Confiar en el Desarrollador (Solo primera vez)

En tu iPhone:
1. Ve a **Ajustes**
2. **General** → **VPN y administración de dispositivos**
3. Bajo "App de desarrollador", toca tu Apple ID
4. Toca **"Confiar en [tu Apple ID]"**
5. Confirma

### Paso 6: Configurar para que se conecte al Backend

```bash
# 1. Obtén tu IP local
ipconfig getifaddr en0
# Ejemplo: 192.168.1.100

# 2. Edita frontend/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# 3. Reconstruye
cd frontend
npx expo run:ios --device
```

## 🔧 Troubleshooting

### Error: "No certificate for team"
```
Solución:
1. En Xcode → Settings → Accounts
2. Selecciona tu Apple ID
3. Click "Manage Certificates"
4. Click "+" → iOS Development
```

### Error: "The application could not be verified"
```
Solución:
En iPhone: Ajustes → General → VPN y administración de dispositivos
→ Confiar en desarrollador
```

### Error: "No devices found"
```bash
# Verifica que Xcode ve tu dispositivo
xcrun xctrace list devices

# Reinicia el demonio de dispositivos
sudo killall -STOP -c usbd
sudo killall -CONT -c usbd
```

### Error: "Failed to connect to backend"
```bash
# Verifica que ambos están en la misma WiFi
# En Mac:
ipconfig getifaddr en0

# En iPhone, verifica WiFi en Ajustes

# Actualiza .env con la IP correcta
```

### La app se cierra inmediatamente
```
Solución:
1. Verifica los logs en Xcode (⌘⇧Y para mostrar consola)
2. Busca errores en rojo
3. Común: Falta confiar en desarrollador (ver Paso 5)
```

## 📊 Checklist para Dispositivo Físico

- [ ] Prebuild ejecutado (`npx expo prebuild --platform ios`)
- [ ] Xcode instalado (versión 15+)
- [ ] Apple ID añadido en Xcode
- [ ] Signing configurado en Xcode
- [ ] iPhone conectado por USB
- [ ] "Confiar en computadora" aceptado en iPhone
- [ ] Desarrollador confiable en iPhone (Ajustes)
- [ ] Backend corriendo en Mac
- [ ] IP local configurada en .env
- [ ] iPhone y Mac en misma red WiFi
- [ ] App ejecutada desde Xcode

## 🎯 Comandos Rápidos

```bash
# Setup inicial
cd /Users/pj/Desktop/Wow/frontend
npx expo prebuild --platform ios
cd ios && open WowEvents.xcworkspace

# Ejecutar en dispositivo
cd /Users/pj/Desktop/Wow/frontend
npx expo run:ios --device

# Ver logs
npx react-native log-ios

# Limpiar y reconstruir
cd ios
rm -rf build/
pod install
cd ..
npx expo run:ios --device --clean
```

## 🌐 Alternativa: Desarrollo Inalámbrico

Después de la primera ejecución con cable:

1. En Xcode: Window → Devices and Simulators
2. Selecciona tu iPhone
3. Marca "Connect via network"
4. Desconecta el cable USB
5. Tu iPhone aparecerá con un ícono de WiFi

## 📝 Notas Importantes

1. **Certificado de Desarrollo Personal** (GRATIS):
   - ✅ Válido para desarrollo y testing
   - ✅ Puede instalar en hasta 3 dispositivos
   - ⚠️ La app expira cada 7 días (debes reinstalar)
   - ❌ No puedes publicar en App Store

2. **Cuenta de Desarrollador** ($99/año):
   - ✅ Sin límite de dispositivos
   - ✅ Apps no expiran
   - ✅ Puedes publicar en App Store
   - ✅ TestFlight para beta testing

3. **Bundle Identifier**:
   - Debe ser único globalmente
   - Formato: `com.tuempresa.nombreapp`
   - No puede contener espacios o caracteres especiales

## ✅ Estado Actual

| Ítem | Estado | Notas |
|------|--------|-------|
| Proyecto iOS generado | ✅ | Listo con `npx expo prebuild` |
| CocoaPods instalado | ✅ | Instalado automáticamente |
| Permisos configurados | ✅ | Cámara, galería, micrófono |
| Bundle Identifier | ✅ | `com.wow.events` |
| Signing | ⚠️ | **Necesitas configurar en Xcode** |
| Dispositivo conectado | ❌ | **Conecta tu iPhone** |
| Backend accesible | ⚠️ | **Necesitas IP local en .env** |

## 🚀 Para Empezar AHORA

```bash
# 1. Abre Xcode
cd /Users/pj/Desktop/Wow/frontend/ios
open WowEvents.xcworkspace

# 2. Conecta tu iPhone

# 3. En Xcode:
#    - Añade tu Apple ID en Settings → Accounts
#    - Selecciona tu iPhone en la barra superior
#    - Presiona el botón ▶️

# 4. En tu iPhone, confía en el desarrollador
#    Ajustes → General → VPN y administración
```

---

**Siguiente paso**: Abre Xcode y configura el signing con tu Apple ID (es gratis). ¿Necesitas ayuda con algún paso específico?
