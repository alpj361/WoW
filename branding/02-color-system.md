# 02 — Sistema de Color

> Inspirado en iluminación neon nocturna. Vibrante, profundo, con energía propia.
> El fondo siempre es oscuro. El color es luz, no pintura.

---

## Paleta Principal

### Fondos base

| Token | Hex | Uso |
|---|---|---|
| `color-bg-deepest` | `#0F0F0F` | Fondo raíz de la app web |
| `color-bg-night` | `#1A0A2E` | Fondo base de marca (brand dark) |
| `color-bg-surface` | `#1E1E28` | Superficies elevadas, cards sin imagen |
| `color-bg-glass` | `rgba(30, 30, 40, 0.5)` | Overlays glass, tab bar, modales |

### Colores primarios de marca

| Token | Hex | Rol |
|---|---|---|
| `color-brand-purple-deep` | `#6B21A8` | Color dominante. Fondos de contenido principal |
| `color-brand-purple` | `#8B5CF6` | Acento activo: tabs, glows, bordes resaltados |
| `color-brand-purple-light` | `#A855F7` | Gradientes, bordes activos, subtítulos destacados |
| `color-brand-orange` | `#F97316` | Energía, acción, CTAs, pez dorado |

### Colores secundarios

| Token | Hex | Rol |
|---|---|---|
| `color-accent-cyan` | `#22D3EE` | Links, URLs, elementos digitales. `wowio.app` siempre en este color |
| `color-accent-green` | `#10B981` | Login / autenticación, éxito de sesión |
| `color-accent-pink` | `#EC4899` | Categoría Voluntariado |

### Colores de texto

| Token | Hex | Uso |
|---|---|---|
| `color-text-primary` | `#FFFFFF` | Títulos, cuerpo principal |
| `color-text-secondary` | `rgba(255,255,255,0.7)` | Subtítulos, metadatos |
| `color-text-muted` | `#6B7280` | Placeholders, información terciaria |
| `color-text-disabled` | `rgba(255,255,255,0.3)` | Estados deshabilitados |

### Colores semánticos

| Token | Hex | Uso |
|---|---|---|
| `color-success` | `#10B981` | Login OK, guardado, confirmación |
| `color-error` | `#EF4444` | Error de formulario, fallo |
| `color-warning` | `#F59E0B` | Advertencia, contenido próximo a vencer |
| `color-info` | `#22D3EE` | Información neutral, tooltips |

---

## Gradientes

### Gradiente de marca (logo)
```css
background: linear-gradient(90deg, #A855F7 0%, #F97316 100%);
```

### Gradiente de fondo hero
```css
background: linear-gradient(180deg, #1A0A2E 0%, #0F0F0F 100%);
```

### Gradientes por categoría de evento

| Categoría | Gradiente |
|---|---|
| Música & Cultura | `rgba(139,92,246,0.8)` → `rgba(109,40,217,0.9)` |
| Voluntariado | `rgba(236,72,153,0.8)` → `rgba(190,24,93,0.9)` |
| General / Gastronomía | `rgba(245,158,11,0.8)` → `rgba(217,119,6,0.9)` |
| Procesiones / Cuaresma | `rgba(139,92,246,0.6)` → `rgba(30,10,46,0.95)` |

### Gradiente de overlay en cards
```css
/* Sobre imagen, de abajo hacia arriba */
background: linear-gradient(
  to top,
  rgba(0, 0, 0, 0.9) 0%,
  rgba(0, 0, 0, 0.4) 50%,
  transparent 100%
);
```

---

## Glass Morphism

El glass es la textura visual central de WOW! en web. Toda superficie elevada sobre el fondo usa glass.

```css
/* Glass estándar */
background: rgba(30, 30, 40, 0.5);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(139, 92, 246, 0.15);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

/* Glass tab bar (borde superior luminoso) */
border-top: 1px solid rgba(139, 92, 246, 0.4);
box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.3);

/* Glass card hover */
border: 1px solid rgba(139, 92, 246, 0.3);
box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
```

---

## Opacidades estándar

| Nivel | Opacidad | Uso |
|---|---|---|
| Hover overlay | `0.08` | Fondo de hover en elementos interactivos |
| Glass overlay | `0.5` | Superficies glass |
| Glow activo | `0.25` | Halo púrpura detrás de íconos activos |
| Borde sutil | `0.15` | Bordes de cards en estado normal |
| Borde activo | `0.4` | Bordes en estado selected/active/hover |
| Sombra | `0.3` | Box shadows |

---

## Reglas de color

1. **El fondo siempre es oscuro** — nunca usar fondos blancos o claros en la app
2. **El texto principal siempre es blanco** sobre fondo oscuro
3. **Los CTAs principales** van en Naranja `#F97316` o Púrpura `#8B5CF6`
4. **`wowio.app` y URLs** siempre en Cyan `#22D3EE`
5. **El gradiente de marca** (púrpura→naranja) es exclusivo del logo y elementos hero
6. **No usar más de 3 colores** en una misma composición (excl. texto y fondo)
7. **El neon existe con moderación** — es un acento, no el fondo completo
