# 06 — Flujos de Usuario

> Antes de cualquier decisión visual: ¿de dónde viene el usuario, qué quiere hacer, y a dónde llega?
> Si el flujo no funciona en texto, no lo arregla ningún diseño.

---

## Flujos principales

### 1. Descubrir eventos (Guest)

**Viene de**: Link directo, redes sociales, boca a boca, búsqueda
**Quiere**: Ver qué hay hoy en la ciudad, sin complicarse
**Llega**: Una tarjeta de evento concreta que le interesa

```
[Entrada web wowio.app]
        │
        ▼
[Feed de eventos — swipe]
        │
   ¿Le interesa?
   ├── No → swipe izquierda → siguiente card
   └── Sí → toca la card
              │
              ▼
        [Modal detalle de evento]
              │
         ¿Quiere guardar?
         ├── No → cierra modal → siguiente card
         └── Sí → [Prompt de login]
                       │
                       ▼
                 [Pantalla /auth]
```

**Regla de oro**: El guest llega al feed SIN friction. Sin splash, sin registro, sin popup. Directo al contenido.

---

### 2. Registrarse / Iniciar sesión

**Viene de**: Intento de guardar un evento, tab de perfil, invitación
**Quiere**: Acceder a su cuenta para guardar eventos y tener perfil
**Llega**: Feed con tab bar completo + su evento guardado

```
[/auth]
   │
   ├── Ingresa email
   │        │
   │        ▼
   │   [Magic link enviado]
   │        │
   │        ▼
   │   [Abre email → clic en link]
   │        │
   │        ▼
   │   [/auth-callback]
   │        │
   │        ▼
   │   [Verifica sesión]
   │        │
   │        ▼
   │   [/ — Feed] ← tab bar completo aparece
   │
   └── OAuth (Google/futuro)
            │
            ▼
       [Redirect inmediato a /]
```

**Puntos de fricción a eliminar**:
- No pedir nombre, foto ni datos en el registro inicial
- Magic link debe llegar en < 30s o el usuario abandona
- Auth callback debe ser invisible — loading spinner mientras procesa

---

### 3. Guardar un evento (usuario autenticado)

**Viene de**: Feed de exploración (swipe)
**Quiere**: No perder de vista este evento
**Llega**: El evento aparece en Mis Eventos

```
[Feed — Event Card]
        │
   Swipe derecha ─────────────────────┐
        │                             │
        │                     [Feedback inmediato]
        │                     ❤️ overlay + haptic
        │
        ▼
[Siguiente card] ←── flujo continúa sin interrupciones

[En paralelo, sin bloquear UI]:
  → Supabase guarda el evento
  → /myevents se actualiza
```

**Regla**: Guardar no puede interrumpir el swipe. El feedback es inmediato (optimistic update). Si falla, muestra toast de error.

---

### 4. Crear un evento

**Viene de**: Tab "Crear" (solo autenticados)
**Quiere**: Publicar su evento para que otros lo descubran
**Llega**: Evento publicado y visible en el feed

```
[/create]
   │
   ├── Completa formulario
   │   ├── Nombre del evento (requerido)
   │   ├── Categoría (selector)
   │   ├── Fecha y hora
   │   ├── Ubicación
   │   ├── Descripción
   │   ├── Audiencia
   │   └── Imagen (opcional)
   │
   ▼
[Validación inline — errores en tiempo real]
   │
   ▼
[CTA "Publicar evento"]
   │
   ▼
[Loading + optimistic]
   │
   ▼
[Toast: "¡Tu evento está publicado!"]
   │
   ▼
[Redirect a /myevents → tab "Mis eventos"]
```

**Regla**: Cada campo tiene un label claro y un placeholder que da un ejemplo real. El error aparece al salir del campo (onBlur), no al submit.

---

### 5. Ver mi perfil y tarjeta digital

**Viene de**: Tab Perfil
**Quiere**: Ver su tarjeta, compartir su QR, gestionar su cuenta
**Llega**: Tarjeta digital lista para compartir

```
[/profile]
   │
   ├── Ver tarjeta digital (DigitalCard)
   │        │
   │        └── [Tap] → flip a QR code
   │                       │
   │                       └── [Tap] → vuelve a tarjeta
   │
   ├── Ver mis eventos publicados
   ├── Ver mis eventos guardados
   ├── Ver mis pins / coleccionables
   └── Cerrar sesión → confirmación → /auth
```

---

### 6. Explorar procesiones (Cuaresma)

**Viene de**: Feed con filtro activo de Cuaresma / banner promocional
**Quiere**: Saber el recorrido y horario de una procesión específica
**Llega**: Modal con toda la información de la procesión

```
[Feed — modo Procesiones activado via FeedModeToggle]
        │
        ▼
[Lista de procesiones]
        │
   Toca procesión
        │
        ▼
[ProcessionDetailModal]
   ├── Nombre y número de orden
   ├── Fecha y horario estimado
   ├── Recorrido en mapa o texto
   ├── Cargadores / hermandad
   └── [Botón guardar]
```

---

## Arquitectura de información

### Qué es visible sin login (Guest)
- Feed de exploración (swipe cards)
- Detalle de evento individual (`/event/[id]`)
- Pantalla de auth (`/auth`)
- Términos y privacidad

### Qué requiere login
- Guardar eventos
- Crear eventos (`/create`)
- Mis eventos (`/myevents`)
- Perfil y tarjeta digital (`/profile`)
- Spots/lugares (`/places`)

### Jerarquía de navegación

```
Tab Bar (visible para autenticados en web y nativo)
├── Explorar [/]          ← siempre first, siempre visible
├── Crear [/create]       ← autenticados
├── Mis Eventos [/myevents]  ← autenticados
└── Perfil [/profile]    ← autenticados

Rutas sin tab bar:
├── /auth
├── /auth-callback
├── /auth-verify
├── /event/[id]          ← bottom sheet sobre el feed
├── /terminos
└── /privacidad
```

### Prioridad de contenido en el feed

```
1. Eventos de HOY                    ← máxima prioridad, badge "HOY"
2. Eventos de esta semana
3. Eventos futuros
4. ─── Separador ───
5. Procesiones (temporada Cuaresma)
```

---

## Reglas generales de flujo

- **El guest nunca ve un paywall** — siempre ve contenido antes del prompt de registro
- **El prompt de login aparece solo en acciones de valor** (guardar, crear)
- **No hay pasos intermedios innecesarios** — de login a feed es 1 paso
- **Los errores tienen CTA claro** — nunca un error sin solución sugerida
- **Back siempre está disponible** — ningún flujo atrapa al usuario
