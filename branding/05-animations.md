# 05 — Animaciones y Micro-interacciones

> WOW! se siente vivo. Las animaciones no son decoración — refuerzan el flujo,
> comunican estado y dan personalidad. Cada movimiento tiene un propósito.

---

## Principios de movimiento

1. **Propósito antes de estética** — si la animación no comunica algo, no va
2. **Suave pero rápido** — spring physics, no lineales; duración típica 200–400ms
3. **El usuario no espera** — las animaciones se ejecutan mientras el sistema trabaja
4. **Consistencia** — el mismo tipo de transición siempre se ve igual
5. **Reducido en accesibilidad** — respetar `prefers-reduced-motion`

---

## Sistema de timing

| Tipo | Duración | Easing | Uso |
|---|---|---|---|
| Instantáneo | 100ms | ease-out | Hover, active/press |
| Rápido | 200ms | ease-out | Chips, badges, tooltips |
| Estándar | 300ms | spring (mass:1, damping:15) | Cards, modales, transiciones |
| Suave | 400–500ms | spring (mass:1, damping:20) | Sheet bottom, swipe overlay |
| Lento | 600ms+ | ease-in-out | Splash, intro radial, loader |

### Configuración spring estándar (Reanimated)
```ts
withSpring(value, {
  mass: 1,
  damping: 15,
  stiffness: 120,
})
```

### Spring para swipe de cards
```ts
withSpring(value, {
  mass: 0.5,
  damping: 12,
  stiffness: 100,
})
```

---

## Animaciones por componente

### Event Card — Swipe
| Acción | Animación |
|---|---|
| Drag horizontal | translateX + rotate (-15° a +15°) |
| Swipe derecha (guardar) | fly out derecha + scale 0.8 + fade out |
| Swipe izquierda (pasar) | fly out izquierda + scale 0.8 + fade out |
| Release sin completar | spring back a posición 0 |
| Card siguiente | scale 0.95→1 + translateY 20→0 al entrar |
| Overlay "❤️ Guardado" | fade in verde en drag derecha |
| Overlay "✕ Pasado" | fade in rojo/gris en drag izquierda |

### Parallax en imagen de card
```
Al hacer drag, la imagen se mueve en dirección opuesta
con un factor de 0.3 (overshoot: 28px)
→ efecto de profundidad y vidrio
```

### Tab Bar
| Evento | Animación |
|---|---|
| Tab activa | glow circle fade in (opacity 0→0.25) · 200ms |
| Tab inactiva | glow fade out · 200ms |
| Cambio de tab | scale del ícono 1→1.15→1 · spring |

### Bottom Sheet (modal)
```
Entrada: translateY(100%) → translateY(0) · spring 400ms
Salida:  translateY(0) → translateY(100%) · ease-in 250ms
Backdrop: opacity 0→0.7 · 300ms
```

### Botón Primary
```
Hover:  scale(1.02) + brightness(1.1) · 150ms ease-out
Press:  scale(0.97) · 100ms ease-out
Release: scale(1) · spring
```

### Botón Icon (circular — swipe buttons)
```
Press:  scale(0.9) · 100ms
Release: scale(1.2) → scale(1) · spring (overshoot)
Haptic: impacto en press (nativo)
```

### Category Filter Chips
```
Select:   background fade in · border color transition · 200ms
Deselect: reverse · 200ms
Scroll horizontal: sin snap, momentum nativo
```

### Splash / Intro
```
WoW Logo:    fade in + scale(0.8→1) · 600ms ease-out
             luego pulse leve en loop mientras carga
Radial Intro: partículas orbitales expandiéndose hacia afuera
Transition:   fade out completo + fade in a home · 400ms
```

---

## Micro-interacciones de feedback

### Guardar evento (❤️)
```
1. Ícono corazón: scale(1→1.4→1) · spring · 300ms
2. Color: gris → rojo/púrpura · 200ms
3. Partículas de corazones pequeños flotando hacia arriba (opcional)
4. Haptic: impact medium (nativo)
```

### Login / Auth éxito
```
1. Spinner → check verde (#10B981) · morphing · 400ms
2. Screen fade out · 300ms
3. Tab bar slide up desde bottom · spring · 400ms
```

### Error en formulario
```
1. Input border: default → #EF4444 · 200ms
2. Input shake: translateX(-8, 8, -6, 6, -4, 4, 0) · 400ms
3. Label error fade in · 200ms
```

### Toast / Notificación
```
Entrada: slide down desde top + fade in · 300ms spring
Salida:  slide up + fade out · 200ms
Auto-dismiss: 3 segundos
```

### QR Code reveal
```
Fade in + scale(0.9→1) · spring · 400ms
Borde gradiente animado (rotación continua en loop)
```

---

## Lottie — Animaciones complejas

Las animaciones de Lottie se usan para:
- **Splash screen** — logo animado al iniciar
- **Coleccionables / Pins** — animación de otorgamiento
- **Estados vacíos** — ilustración animada de "no hay eventos"
- **El Pez** — apariciones del personaje mascota

### Reglas para Lottie
- Siempre sobre fondo oscuro `#0F0F0F` o `#1A0A2E`
- Tamaño máximo en pantalla: 60% del viewport
- No interrumpir con interacciones hasta que complete 1 ciclo
- En web: usar `lottie-react` · en nativo: `lottie-react-native`

---

## Transiciones de pantalla (Expo Router)

| Transición | Animación |
|---|---|
| Tab change | Fade cross · 200ms |
| Push (navegar a detalle) | Slide from right · 300ms |
| Modal | Slide from bottom · spring |
| Back | Slide to right · 250ms ease-in |
| Auth → Home | Fade cross · 400ms |

---

## Accesibilidad

```ts
// Respetar prefers-reduced-motion
import { AccessibilityInfo } from 'react-native';

// En web:
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Cuando `reduceMotion` está activo:
- Swipe: sin animación de vuelo, solo fade
- Transiciones: solo fade, sin slide
- Lottie: mostrar frame estático
- Micro-interacciones: solo cambios de color, sin scale
