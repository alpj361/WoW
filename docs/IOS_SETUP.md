# 📱 Guía de Configuración iOS para WOW

## ✅ Configuración Completada

### 1. Iconos de Aplicación
- ✅ Icono principal: `frontend/assets/images/icon.png`
- ✅ Icono adaptativo: `frontend/assets/images/adaptive-icon.png`
- ✅ Icono de splash: `frontend/assets/images/splash-icon.png`

### 2. Configuración en app.json

```json
{
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.wow.events",
    "buildNumber": "1",
    "infoPlist": {
      "NSCameraUsageDescription": "WOW necesita acceso a tu cámara para escanear códigos QR y tomar fotos de eventos",
      "NSPhotoLibraryUsageDescription": "WOW necesita acceso a tu galería para seleccionar imágenes de eventos",
      "NSMicrophoneUsageDescription": "WOW necesita acceso al micrófono para grabar videos de eventos"
    }
  }
}
```

### 3. Plugins Nativos Configurados

```json
"plugins": [
  "expo-router",
  ["expo-splash-screen", {...}],
  ["expo-camera", {
    "cameraPermission": "WOW necesita acceso a tu cámara para escanear códigos QR y tomar fotos de eventos"
  }],
  ["expo-image-picker", {
    "photosPermission": "WOW necesita acceso a tu galería para seleccionar imágenes de eventos"
  }]
]
```

### 4. Dependencias Nativas Instaladas

- ✅ `expo-camera` v17.0.10 - Para escanear códigos QR
- ✅ `expo-image-picker` v17.0.10 - Para seleccionar imágenes
- ✅ `expo-av` v16.0.8 - Para reproducción de medios
- ✅ `react-native-qrcode-svg` v6.3.21 - Para generar códigos QR

## 🚀 Pasos para Ejecutar en iOS

### Opción 1: Desarrollo con Expo Go (Más Rápido)

```bash
cd frontend
npm start
# Luego presiona 'i' para abrir en simulador iOS
# O escanea el QR con la app Expo Go en tu iPhone
```

**⚠️ Limitación**: Expo Go tiene limitaciones con módulos nativos personalizados.

### Opción 2: Build Nativo (Recomendado para Producción)

```bash
cd frontend

# 1. Generar carpeta ios/ nativa
npx expo prebuild --platform ios

# 2. Instalar dependencias de CocoaPods
cd ios
pod install
cd ..

# 3. Ejecutar en simulador
npx expo run:ios

# O especificar un dispositivo
npx expo run:ios --device
```

### Opción 3: Usando Xcode Directamente

```bash
# Después de ejecutar prebuild
cd frontend/ios
open WowEvents.xcworkspace

# Luego en Xcode:
# 1. Selecciona el simulador o dispositivo
# 2. Presiona ⌘R para ejecutar
```

## 📋 Requisitos Previos

### Para Desarrollo iOS necesitas:

1. **macOS** - iOS solo se puede desarrollar en Mac
2. **Xcode** (versión 15.0 o superior)
   ```bash
   # Instalar desde App Store o:
   xcode-select --install
   ```

3. **CocoaPods** - Gestor de dependencias para iOS
   ```bash
   # Instalar con Homebrew
   brew install cocoapods
   
   # O con gem
   sudo gem install cocoapods
   ```

4. **Node.js** (versión 18 o superior)
   ```bash
   node --version  # Verificar instalación
   ```

## 🔧 Troubleshooting

### Problema: "No se puede encontrar CocoaPods"
```bash
# Reinstalar CocoaPods
sudo gem install cocoapods
pod setup
```

### Problema: "Build failed" en Xcode
```bash
# Limpiar y reinstalar
cd frontend/ios
pod deintegrate
pod install
cd ..
npx expo run:ios --clean
```

### Problema: "Unable to boot simulator"
```bash
# Listar simuladores disponibles
xcrun simctl list devices

# Reiniciar simulador
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"
```

### Problema: Cambios en app.json no se reflejan
```bash
# Regenerar configuración nativa
cd frontend
rm -rf ios/
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

## 🎯 Características Específicas de iOS

### QR Scanner
- Usa la cámara nativa con `expo-camera`
- Permisos solicitados automáticamente
- Funciona en dispositivos físicos y simulador (con limitaciones)

### Image Picker
- Acceso a la galería de fotos
- Soporte para múltiples selección
- Compresión automática de imágenes

### Notificaciones Push (Futuro)
- Requiere certificados de Apple Developer
- Configuración en Apple Developer Portal
- Implementación con `expo-notifications`

## 📱 Testing en Dispositivos Físicos

### 1. Con Cable USB

```bash
# Conecta tu iPhone
# Confía en la computadora cuando se solicite
npx expo run:ios --device
```

### 2. Desarrollo Inalámbrico

1. Conecta iPhone y Mac a la misma red WiFi
2. En Xcode: Window > Devices and Simulators
3. Selecciona tu dispositivo > Enable "Connect via Network"
4. Desconecta el cable USB

### 3. Con TestFlight (Producción)

Requiere cuenta de Apple Developer ($99/año):
```bash
# Build para producción
eas build --platform ios
# Subir a TestFlight
eas submit --platform ios
```

## 🔐 Configuración de Bundle Identifier

**Actual**: `com.wow.events`

Para cambiar:
1. Edita `frontend/app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.tuempresa.wow"
   }
   ```
2. Regenera el proyecto:
   ```bash
   npx expo prebuild --platform ios --clean
   ```

## 📊 Estado del Proyecto

| Característica | Web | Android | iOS |
|---------------|-----|---------|-----|
| Ver Eventos | ✅ | ✅ | ✅* |
| Crear Eventos | ✅ | ✅ | ✅* |
| Escanear QR | ❌ | ✅ | ✅* |
| Generar QR | ✅ | ✅ | ✅* |
| Subir Imágenes | ✅ | ✅ | ✅* |
| Auth (Supabase) | ✅ | ✅ | ✅* |

*Pendiente de testing en dispositivo físico

## 🎨 Próximos Pasos

1. ✅ Configuración básica completada
2. ⏳ **Ejecutar prebuild y testing**
3. ⏳ Probar en simulador iOS
4. ⏳ Probar en dispositivo físico
5. ⏳ Optimizar rendimiento
6. ⏳ Configurar deep linking
7. ⏳ Setup de notificaciones push

## 📚 Recursos Útiles

- [Expo iOS Documentation](https://docs.expo.dev/workflow/ios/)
- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [CocoaPods Guides](https://guides.cocoapods.org/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

---

**Última actualización**: 27 de Enero, 2026
**Versión de la app**: 0.0.1
**Estado**: Configuración completada, pendiente de testing
