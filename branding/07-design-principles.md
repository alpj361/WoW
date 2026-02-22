# 07 — Principios de Diseño

> Las reglas de la casa. Todo lo que se construya para WOW! debe pasar por estos filtros.
> Son inamovibles — aplican en todas las pantallas, sin excepción.

---

## 1. Dark First

WOW! vive de noche. **Nunca diseñar sobre fondos blancos o claros.**

- Fondo base: `#0F0F0F` o `#1A0A2E`
- Si hay duda entre dos opciones, elegir la más oscura
- Los elementos claros son la excepción (texto blanco, badges, iconos)
- El color es luz que emerge de la oscuridad, no pintura sobre blanco

---

## 2. Glass Morphism — con moderación

El glass es la textura visual de WOW!. Pero el glass usado en exceso pierde su efecto.

**Dónde usar glass:**
- Tab bar / navegación
- Modales y bottom sheets
- Overlays de información sobre imágenes
- Cards sin imagen de fondo

**Dónde NO usar glass:**
- Fondos de pantalla completa (solo oscuro sólido)
- Sobre otros elementos glass (glass sobre glass = ruido)
- En elementos muy pequeños (< 40px) donde el blur no se percibe

**La fórmula del glass WOW!:**
```css
background: rgba(30, 30, 40, 0.5);
backdrop-filter: blur(24px);
border: 1px solid rgba(139, 92, 246, 0.15);
```

---

## 3. El Neon existe como acento, no como base

El púrpura `#8B5CF6` y el naranja `#F97316` son acentos de alta energía.
Funcionan porque contrastan con el oscuro. Si se usan en exceso, pierden impacto.

- **Máximo 1 elemento neon de alta saturación** por sección visual
- Los glows y halos deben ser sutiles (opacity 0.15–0.25)
- El gradiente logo (púrpura→naranja) es solo para el logo y elementos hero
- En texto: solo para categorías activas, CTAs o URLs — nunca para párrafos

---

## 4. Surrealism como identidad, no como ruido

El estilo visual de WOW! puede ser surreal (El Pez, composiciones inesperadas, tensión visual).
Pero el surrealismo es intencional, no caótico.

**Cómo aplicar surrealismo bien:**
- Un elemento inesperado por pantalla — no todos
- El Pez aparece en contextos específicos (onboarding, vacíos, campañas)
- Las ilustraciones surreales siempre tienen iluminación neon consistente
- La interfaz funcional (botones, inputs, cards) NO es surreal — es clara

**El surrealismo vive en**: ilustraciones, animaciones de Lottie, el personaje mascota
**El surrealismo NO vive en**: navegación, formularios, textos de UI, errores

---

## 5. Contraste — nada gris por defecto

Cada elemento de la pantalla debe distinguirse claramente del que está junto a él.

- **Texto sobre imagen**: siempre con sombra o overlay gradient
- **Texto sobre fondo oscuro**: mínimo `rgba(255,255,255,0.7)` para secundarios, nunca menos
- **Botón activo vs inactivo**: diferencia perceptual inmediata (no solo opacidad)
- **Tab activa vs inactiva**: color + glow vs gris — nunca solo gris vs gris ligeramente más claro

**Ratio de contraste mínimo (WCAG AA):**
- Texto normal: 4.5:1
- Texto grande (> 18px bold): 3:1
- Elementos de UI (botones, inputs): 3:1

---

## 6. Balance — espacio como decisión, no como relleno

El espacio vacío en WOW! no es un error — es parte del diseño.

- **Padding estándar**: 16–20px en móvil, 24px en web
- **Gap entre cards**: 12–16px
- **Máximo ancho de contenido en web**: 428px (simulación de viewport móvil)
- **Las cards de evento ocupan el 85–90% del ancho** — sin margen excesivo

**Ritmo visual**: elementos del mismo nivel se ven iguales entre sí.
Si dos H3 se ven diferentes, hay un error — no un "detalle creativo".

---

## 7. Consistencia — la regla de oro

Es la más importante. Un diseño inconsistente destruye la confianza del usuario.

**Checklist de consistencia:**
- [ ] Todos los H2 de la app tienen el mismo tamaño y peso
- [ ] Todos los botones primarios tienen el mismo radio, padding y color
- [ ] Todos los chips de categoría tienen el mismo alto y tipografía
- [ ] Las sombras de cards usan siempre los mismos valores
- [ ] El spacing entre secciones es siempre múltiplo de 4px (4, 8, 12, 16, 20, 24, 32...)
- [ ] Los estados (hover, active, disabled) se ven igual en todos los componentes similares

---

## 8. Simpleza — menos es más, en serio

WOW! tiene muchas funcionalidades. El trabajo del diseño es hacer que no se noten todas a la vez.

**Principios de simpleza:**
- Una pantalla, un objetivo principal
- Máximo 2 CTAs en cualquier vista (uno primario, uno secundario)
- Si un elemento no ayuda al usuario a completar su tarea, no va
- La decoración existe solo si refuerza la identidad — no por llenar espacio
- Cuando hay duda entre agregar o quitar: **quitar**

---

## 9. Mobile First, siempre

Aunque WOW! tiene versión web, el diseño parte desde móvil.

- El viewport web está fijo a **428px de ancho** (iPhone 14 Pro Max)
- Todos los touch targets mínimo **44x44px**
- El scroll es vertical — sin scroll horizontal excepto en carruseles específicos
- Los textos no son más pequeños de **12px** en ningún estado

---

## 10. El usuario no lee — escanea

El contenido debe ser comprensible en 3 segundos de escaneo visual.

- **Nombre del evento**: lo más grande y visible de la card
- **Fecha y hora**: siempre junto al nombre, en segundo nivel de jerarquía
- **CTA**: claro, con una sola acción por card
- **Categoría**: chip visual de color inmediato — no texto plano

Si hay más de 3 piezas de información compitiendo por atención en el mismo espacio, rediseñar.

---

## Anti-patrones — lo que WOW! nunca hace

| ❌ No | ✅ Sí |
|---|---|
| Fondos blancos | Fondos oscuros `#0F0F0F` / `#1A0A2E` |
| Texto gris sobre gris | Texto blanco con contraste claro |
| 35 variantes de botón | 4 variantes con estados definidos |
| Popup de registro al entrar | Contenido primero, registro cuando agrega valor |
| Animaciones sin propósito | Cada animación comunica un estado |
| Información duplicada en UI | Una fuente de verdad por dato |
| Bordes redondeados inconsistentes | Radios del sistema: 6, 8, 12, 16, 20, 24, 50% |
| Más de 2 fuentes en una pantalla | Plus Jakarta Sans + sistema |
| Colores de acento en fondos | Colores de acento solo en elementos interactivos |
