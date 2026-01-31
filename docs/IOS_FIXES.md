# 🔧 Correcciones iOS - Errores de Compatibilidad React

## ❌ Problemas Encontrados

Al ejecutar `npx expo run:ios`, se presentaron los siguientes errores:

### 1. Error Principal: Incompatibilidad de Versiones React
```
ERROR [Error: Incompatible React versions: The "react" and "react-native-renderer" packages must have the exact same version. Instead got:
  - react:                  19.0.0
  - react-native-renderer:  19.1.0
```

### 2. Warnings de Rutas
```
WARN Route "./_layout.tsx" is missing the required default export
WARN Route "./index.tsx" is missing the required default export
WARN Route "./myevents.tsx" is missing the required default export
WARN Route "./profile.tsx" is missing the required default export
```

**Nota**: Estos warnings eran FALSOS - todos los archivos SÍ tenían default exports. El problema era el error de React que impedía que se cargaran correctamente.

### 3. Warning de Deprecación
```
WARN [expo-av]: Expo AV has been deprecated and will be removed in SDK 54
```

## ✅ Soluciones Aplicadas

### 1. Actualización de Versiones React

**Cambios en `package.json`:**

#### Antes:
```json
{
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    ...
  },
  "devDependencies": {
    "@types/react": "~19.0.10",
    ...
  }
}
```

#### Después:
```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-dom": "19.1.0",
    ...
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    ...
  }
}
```

**Razón**: React Native 0.81.5 requiere específicamente React 19.1.0, no 19.0.0.

### 2. Reinstalación de Dependencias

```bash
# Actualizar package.json (cambios arriba)
cd /Users/pj/Desktop/Wow/frontend

# Reinstalar con --legacy-peer-deps para resolver conflictos
npm install --legacy-peer-deps

# Resultado: ✅ Instalación exitosa
```

### 3. Reconstrucción del Proyecto iOS

```bash
# Limpiar build anterior
rm -rf ios/build

# Reinstalar pods con las nuevas versiones
cd ios
pod install
cd ..

# Resultado: ✅ 107 pods instalados correctamente
```

## 🎯 Estado Actual

| Componente | Antes | Después | Estado |
|-----------|-------|---------|--------|
| React | 19.0.0 | 19.1.0 | ✅ Compatible |
| React DOM | 19.0.0 | 19.1.0 | ✅ Compatible |
| @types/react | ~19.0.10 | ~19.1.0 | ✅ Compatible |
| React Native | 0.81.5 | 0.81.5 | ✅ Compatible |
| CocoaPods | - | 107 pods | ✅ Instalado |

## 📝 Archivos Modificados

1. **`frontend/package.json`**
   - Actualizado `react` de 19.0.0 a 19.1.0
   - Actualizado `react-dom` de 19.0.0 a 19.1.0
   - Actualizado `@types/react` de ~19.0.10 a ~19.1.0

2. **`frontend/ios/Podfile.lock`**
   - Regenerado con las nuevas versiones de React

## 🚀 Próximos Pasos

### Para Probar en Simulador iOS:

```bash
cd /Users/pj/Desktop/Wow/frontend
npx expo run:ios
```

### Para Probar en Dispositivo Físico:

1. **Abrir Xcode**:
   ```bash
   cd ios
   open WOWDescubreEventos.xcworkspace
   ```

2. **Configurar Signing** (en Xcode):
   - Selecciona el proyecto "WOWDescubreEventos"
   - Pestaña "Signing & Capabilities"
   - Añade tu Apple ID en "Team"
   - Marca "Automatically manage signing"

3. **Conectar iPhone** y ejecutar:
   ```bash
   npx expo run:ios --device
   ```

## ⚠️ Nota sobre expo-av

El warning de `expo-av` es informativo - el paquete seguirá funcionando hasta SDK 54. No requiere acción inmediata, pero eventualmente deberás:

- Migrar a `expo-audio` para funcionalidad de audio
- Migrar a `expo-video` para funcionalidad de video

## 🔍 Verificación de Versiones

Para verificar que las versiones son correctas:

```bash
cd /Users/pj/Desktop/Wow/frontend
npm ls react react-dom react-native

# Debería mostrar:
# ├── react@19.1.0
# ├── react-dom@19.1.0
# └── react-native@0.81.5
```

## 📊 Resumen de Comandos Ejecutados

```bash
# 1. Actualizar package.json (manual)
# 2. Reinstalar dependencias
npm install --legacy-peer-deps

# 3. Limpiar y reconstruir iOS
rm -rf ios/build
cd ios && pod install && cd ..

# 4. Ejecutar app (cuando estés listo)
npx expo run:ios
```

## 🔧 Corrección Adicional: Error `document` en iOS

### Problema Encontrado:
```
ERROR [ReferenceError: Property 'document' doesn't exist]
```

### Causa:
El código en `AuthContext.tsx` intentaba acceder al objeto `document` (API del navegador web) sin verificar la plataforma, causando errores en iOS/Android donde `document` no existe.

### Solución Aplicada:

**Archivo modificado**: `frontend/src/context/AuthContext.tsx`

```typescript
// ANTES - Causaba error en iOS
useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && session) {
            // ...
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [session]);

// DESPUÉS - Solo se ejecuta en web
useEffect(() => {
    // ✅ Verificar plataforma PRIMERO
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && session) {
            // ...
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [session]);
```

**Cambios realizados**:
1. Importado `Platform` de `react-native`
2. Agregado check `Platform.OS !== 'web'` al inicio del useEffect
3. Verificación adicional de `typeof document === 'undefined'`
4. Esta funcionalidad ahora SOLO se ejecuta en web, no en iOS/Android

## ✅ Resultado Final

- ✅ Todas las versiones de React ahora son compatibles (19.1.0)
- ✅ Error `document` corregido con verificación de plataforma
- ✅ Código específico de web aislado correctamente
- ✅ CocoaPods instalado correctamente con 107 dependencias
- ✅ Proyecto listo para ejecutar en iOS
- ✅ Compatible con simulador y dispositivo físico

## 📝 Archivos Modificados (Total)

1. **`frontend/package.json`**
   - React: 19.0.0 → 19.1.0
   - React DOM: 19.0.0 → 19.1.0
   - @types/react: ~19.0.10 → ~19.1.0

2. **`frontend/src/context/AuthContext.tsx`**
   - Agregado import de `Platform`
   - Verificación de plataforma antes de usar `document`
   - Código de visibilitychange solo para web

3. **`frontend/ios/Podfile.lock`**
   - Regenerado con nuevas versiones

---

**Fecha de corrección**: 27 de Enero, 2026
**Versiones corregidas**: React 19.0.0 → 19.1.0
**Errores corregidos**: Version mismatch, document reference
**Estado**: ✅ Listo para testing en iOS
