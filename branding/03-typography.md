# 03 — Tipografía

> Claridad, impacto y modernidad. Bold para titulares, legibilidad para cuerpos.
> Máximo dos familias en cualquier pieza.

---

## Familias tipográficas

### Display / Headlines — Plus Jakarta Sans ExtraBold
- **Uso**: Logo WOW!, H1, H2, CTAs principales, nombres de eventos
- **Peso**: 800 (ExtraBold)
- **Característica**: Mayúsculas, alta densidad visual, impacto inmediato
- **Alternativa de marca**: Montserrat ExtraBold (si Plus Jakarta Sans no está disponible)
- **En código**: `PlusJakartaSans-ExtraBold` (cargado via `@expo-google-fonts`)

### Body / UI — Sistema nativo / Inter / Poppins
- **Uso**: Descripciones, subtítulos, textos explicativos, labels
- **Peso**: 400 (Regular) / 500 (Medium) / 600 (SemiBold)
- **Característica**: Blanco o gris claro, legible en pantallas pequeñas
- **Web**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

---

## Escala tipográfica (web)

| Nivel | Tamaño | Peso | Line Height | Uso |
|---|---|---|---|---|
| **H1** | 48–64px | 800 | 1.1 | Hero: "Descubre lo que pasa hoy" |
| **H2** | 32–40px | 700 | 1.2 | Títulos de sección: "Eventos cerca de ti" |
| **H3** | 24–28px | 700 | 1.3 | Títulos de card, modal, subsección |
| **H4** | 18–20px | 600 | 1.4 | Labels de categoría, encabezados secundarios |
| **Body L** | 16px | 400 | 1.6 | Descripción de evento, párrafo principal |
| **Body S** | 14px | 400 | 1.5 | Metadata, detalles de evento, subtexto |
| **Caption** | 11–12px | 400–600 | 1.4 | Fecha, hora, ubicación en chips |
| **Button** | 14–16px | 600–700 | 1 | Labels de botones y CTAs |
| **Tab label** | 10px | 600 | 1 | Labels de tab bar |
| **Overline** | 11px | 700 | 1.2 | Etiquetas uppercase antes de títulos |

---

## Jerarquía visual en pantalla

```
H1  ──────────────────────────────────  48-64px · ExtraBold
     "DESCUBRE LO QUE PASA HOY"

H2  ─────────────────────────────  32-40px · Bold
     "Eventos cerca de ti"

H3  ──────────────────────────  24-28px · Bold
     "Noche de Jazz en Zona 4"

Body L  ─────────────────────  16px · Regular
     "Un encuentro íntimo con los mejores..."

Body S / Caption  ──────────  12-14px · Regular / Medium
     "Hoy · 21:00 · Zona 4, Guatemala"
```

---

## Reglas tipográficas

1. **H1 siempre en mayúsculas** — el logo WOW! nunca en minúscula
2. **`wowio.app` siempre en minúscula** y en color Cyan `#22D3EE`
3. **Máximo 2 familias** en cualquier pieza o pantalla
4. **H1, H2, H3 usan Plus Jakarta Sans** — nunca tipografía genérica para display
5. **Todos los H2 de la app se ven igual** en tamaño y peso — sin excepciones
6. **No centrar texto de párrafo** de más de 2 líneas — alineado a la izquierda
7. **Tracking (letter-spacing)**: H1 puede tener `0.02em` a `0.05em` para impacto
8. **No mezclar pesos** en el mismo titular (e.g., no "**WOW!** Events" con pesos distintos)

---

## Aplicaciones específicas

### Nombre del evento en card
```
Fuente: Plus Jakarta Sans ExtraBold
Tamaño: 20–24px
Color: #FFFFFF
Sombra: 0 2px 8px rgba(0,0,0,0.8)  ← siempre sobre imagen
Max lines: 2
```

### Metadata de evento (fecha · hora · lugar)
```
Fuente: Sistema / Inter
Tamaño: 12px
Peso: 500 (Medium)
Color: rgba(255,255,255,0.7)
```

### CTA de botón principal
```
Fuente: Sistema / Inter
Tamaño: 15–16px
Peso: 700
Color: #FFFFFF
Letter-spacing: 0.02em
```

### Label de categoría (chip)
```
Fuente: Sistema / Inter
Tamaño: 11px
Peso: 700
Transform: uppercase
Letter-spacing: 0.08em
```

### Tab bar labels
```
Fuente: Sistema
Tamaño: 10px
Peso: 600
Color: activo #8B5CF6 · inactivo rgba(255,255,255,0.5)
```
