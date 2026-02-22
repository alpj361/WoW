# WOW! — Design System & Brand Guidelines (Web)

> Versión 1.0 · 2025 · wowio.app

Este directorio contiene el sistema de diseño completo de WOW! para web. Cada documento es una fuente de verdad para decisiones de diseño, desarrollo y comunicación.

---

## Contenido

| Archivo | Qué define |
|---|---|
| [01-brand-identity.md](./01-brand-identity.md) | Logo, mascota, voz, lo que WOW! ES y NO ES |
| [02-color-system.md](./02-color-system.md) | Paleta completa, roles semánticos, gradientes |
| [03-typography.md](./03-typography.md) | Jerarquía tipográfica H1→Caption, pesos, tamaños |
| [04-components.md](./04-components.md) | Botones, tarjetas, inputs, modales, navegación |
| [05-animations.md](./05-animations.md) | Sistema de movimiento, micro-interacciones, timing |
| [06-user-flows.md](./06-user-flows.md) | Flujos de usuario por objetivo |
| [07-design-principles.md](./07-design-principles.md) | Reglas de la casa: contraste, balance, glass morphism |

---

## Estilo en una línea

**Dark · Neon · Glass · Surreal** — WOW! vive de noche, brilla en púrpura y naranja, y su mascota es un hombre con pecera en la cabeza. Eso lo dice todo.

---

## Stack actual (web)

- **Framework**: React Native Web + Expo Router
- **Animations**: React Native Reanimated 4 + Lottie
- **Blur / Glass**: `expo-blur` (nativo) / `backdropFilter` (web)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Fonts**: Plus Jakarta Sans ExtraBold (display) · sistema (body)
- **DB / Auth**: Supabase
