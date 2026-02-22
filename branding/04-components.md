# 04 — Componentes

> Piezas reutilizables con variantes explícitas. Sin estilos ad hoc por pantalla.
> Cada componente debe funcionar en blanco y negro antes de aplicar color.

---

## Botones

### Variantes

#### Primary — Acción principal
```
Background:  #8B5CF6  (o gradiente #A855F7 → #F97316 para hero)
Text:        #FFFFFF · 700 · 15px
Border:      none
Radius:      12px
Padding:     14px 24px
Min-width:   120px
```
**Uso**: "Explorar eventos", "Guardar", "Iniciar sesión", "Crear evento"

#### Secondary — Acción secundaria
```
Background:  rgba(139, 92, 246, 0.15)
Border:      1px solid rgba(139, 92, 246, 0.4)
Text:        #8B5CF6 · 600 · 15px
Radius:      12px
Padding:     14px 24px
```
**Uso**: "Ver más", "Filtrar", "Cancelar"

#### Ghost / Text — Acción terciaria
```
Background:  transparent
Border:      none
Text:        rgba(255,255,255,0.7) · 600 · 14px
Underline:   on hover
```
**Uso**: Links de navegación, "Ver todos", opciones legales

#### Destructive — Acciones irreversibles
```
Background:  rgba(239, 68, 68, 0.15)
Border:      1px solid rgba(239, 68, 68, 0.4)
Text:        #EF4444 · 600 · 15px
Radius:      12px
```
**Uso**: "Eliminar evento", "Cerrar sesión"

#### Icon Button — Circular
```
Size:        48x48px
Radius:      50%
Background:  rgba(255,255,255,0.1)
Border:      2px solid rgba(255,255,255,0.2)
Icon:        24px · #FFFFFF
```
**Uso**: Swipe buttons (❌ pasar / ❤️ guardar), botones flotantes

### Estados de botón
| Estado | Cambio visual |
|---|---|
| Default | Como definido arriba |
| Hover | +10% brillo, leve scale(1.02), sombra suave |
| Active / Press | scale(0.97), -5% brillo |
| Disabled | opacity: 0.4, cursor: not-allowed |
| Loading | Spinner interno, texto oculto |

---

## Tarjetas (Cards)

### Event Card — Principal
```
Ratio:        ~4:5 (portrait)
Radius:       16px
Overflow:     hidden
Background:   imagen de fondo + overlay gradient
Shadow:       0 20px 60px rgba(0,0,0,0.5)
```
**Estructura interna:**
```
┌─────────────────────────────┐
│  [Imagen de fondo]          │  ← 100% fill
│                             │
│  [Chip categoría]  top-left │  ← blur pill
│  [Badge HOY]      top-right │  ← solo si es hoy
│                             │
│  ─── Overlay gradient ───   │
│  H3 Nombre del evento       │  ← ExtraBold
│  📍 Lugar · 🕐 Hora        │  ← Caption
│  [Botón acción]             │  ← Ghost o Icon
└─────────────────────────────┘
```

### Procession Card — Especial Cuaresma
Similar a Event Card pero con:
- Overlay más oscuro y dramático
- Badge de orden/número de procesión
- Colores en paleta púrpura profundo

### Compact Card — Lista
```
Height:       80–100px
Radius:       12px
Layout:       horizontal (imagen izq · info der)
Background:   rgba(30, 30, 40, 0.8)
Border:       1px solid rgba(139,92,246,0.1)
```

### Digital Card — Perfil de usuario
```
Ratio:        ~16:9 landscape
Radius:       20px
Effect:       glass + gradiente de marca + QR
Borde:        gradiente animado púrpura → naranja
```

### Category Filter Chip
```
Height:       34px
Radius:       20px (pill)
Padding:      0 16px
Background activo:   rgba(139,92,246,0.2) + border #8B5CF6
Background inactivo: rgba(255,255,255,0.06) + border rgba(255,255,255,0.1)
Text:         12px · 600 · uppercase
```

---

## Inputs

### Text Input
```
Height:       52px
Radius:       12px
Background:   rgba(255,255,255,0.07)
Border:       1px solid rgba(255,255,255,0.12)
Border focus: 1px solid #8B5CF6 + glow rgba(139,92,246,0.2)
Text:         #FFFFFF · 15px · Regular
Placeholder:  rgba(255,255,255,0.35)
Label:        12px · 600 · #A855F7 (arriba del input)
```

### Estados de Input
| Estado | Border | Background |
|---|---|---|
| Default | rgba(255,255,255,0.12) | rgba(255,255,255,0.07) |
| Focus | #8B5CF6 | rgba(139,92,246,0.08) |
| Error | #EF4444 | rgba(239,68,68,0.08) |
| Disabled | rgba(255,255,255,0.06) | rgba(255,255,255,0.03) |
| Success | #10B981 | rgba(16,185,129,0.08) |

---

## Navegación

### Glass Tab Bar (web — solo usuarios autenticados)
```
Position:     fixed · bottom: 0
Width:        100% (max 428px)
Height:       ~72px + safe area
Background:   rgba(15, 15, 25, 0.75)
Backdrop:     blur(24px)
Border-top:   1px solid rgba(139,92,246,0.4)
Shadow:       0 -4px 30px rgba(0,0,0,0.3)
Radius top:   24px
```
**Tabs visibles:**
- Guest: solo "Explorar" + botón "Login" (verde `#10B981`)
- Autenticado: Explorar · Crear · Mis Eventos · Perfil

### Tab Item
```
Icon activo:   #8B5CF6 · 24px
Icon inactivo: rgba(255,255,255,0.5) · 24px
Label:         10px · 600
Glow activo:   círculo 36x36 rgba(139,92,246,0.25) detrás del ícono
```

---

## Modales / Sheets

### Modal de detalle de evento
```
Position:     bottom sheet (slide up)
Radius top:   24px
Background:   #1A1A2E (glass sobre imagen de fondo)
Backdrop:     blur overlay rgba(0,0,0,0.7)
Max height:   90vh
```
**Contenido estructurado:**
```
Drag handle (línea centrada)
H2 Nombre del evento
Chips de categoría y fecha
Imagen o video
Body descripción
Metadata: lugar, hora, organizador
CTAs: [Guardar] [Compartir] [Ver más]
```

### Modal de reacciones
```
Similar al de evento pero con:
- Lista de reacciones (avatares + texto)
- Input para nuevo comentario sticky al bottom
```

---

## Badges y Chips

### Badge de categoría (en card)
```
Blur pill:    backdrop-filter: blur(8px)
Background:   rgba(0,0,0,0.4)
Border:       1px solid rgba(255,255,255,0.2)
Icon:         12px
Text:         11px · 700 · uppercase
Color:        según categoría
```

### Badge "HOY"
```
Background:   #F97316
Text:         #FFFFFF · 700 · 11px · uppercase
Radius:       6px
Padding:      2px 8px
```

### Badge de pin / coleccionable
```
Size:         32x32px
Radius:       50%
Border:       2px solid gradient púrpura→naranja
Glow:         0 0 8px rgba(139,92,246,0.6)
```

---

## Loaders y Skeletons

### Skeleton de evento
```
Mismas dimensiones que Event Card
Fondo:   rgba(255,255,255,0.05)
Shimmer: animación de brillo izq→der en loop
```

### Spinner
```
Color:   #8B5CF6
Size:    large en carga inicial · small en botones
```

### Lottie Loader (splash)
- Animación del logo WOW! o El Pez
- Sobre fondo `#0F0F0F`
- Loop hasta que auth y datos estén listos
