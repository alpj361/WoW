# Catálogo de Subcategorías — WoW App

> Versión 1.0 | Complementa el campo `category` (music / volunteer / general)
> Cada subcategoría es un valor único en `subcategory TEXT` del esquema de eventos.

---

## Estructura del catálogo

```
id           → valor almacenado en DB  (ej: 'rock-concert')
label        → texto display en app    (ej: 'Concierto Rock')
category     → categoría padre         (ej: 'music')
color        → color hex de acento     (ej: '#8B5CF6')
icon         → ionicons name           (ej: 'musical-notes')
```

---

## Categoría: `music` — Música & Cultura

| id | label | color | icon |
|----|-------|-------|------|
| `rock-concert` | Concierto Rock | `#8B5CF6` | `musical-notes` |
| `pop-concert` | Concierto Pop | `#EC4899` | `musical-notes` |
| `electronic-concert` | Música Electrónica / DJ | `#06B6D4` | `radio` |
| `reggaeton-urbano` | Reggaetón / Urbano | `#F59E0B` | `mic` |
| `jazz-blues` | Jazz & Blues | `#D97706` | `musical-note` |
| `classical-music` | Música Clásica | `#6D28D9` | `musical-notes` |
| `latin-salsa` | Salsa / Cumbia / Merengue | `#EF4444` | `musical-notes` |
| `folk-traditional` | Folklore / Música Regional | `#84CC16` | `musical-notes` |
| `indie-alternative` | Indie / Alternativo | `#A855F7` | `musical-notes` |
| `hip-hop-rap` | Hip-Hop / Rap | `#F97316` | `mic` |
| `metal-hardcore` | Metal / Hardcore | `#374151` | `musical-notes` |
| `acoustic-unplugged` | Acústico / Unplugged | `#78716C` | `musical-note` |
| `open-mic` | Open Mic / Jam Session | `#10B981` | `mic-outline` |
| `live-band` | Banda en Vivo | `#8B5CF6` | `musical-notes` |
| `music-festival` | Festival de Música | `#F59E0B` | `flag` |
| `dj-set` | DJ Set / Night Club | `#06B6D4` | `disc` |
| `karaoke` | Karaoke | `#EC4899` | `mic` |
| `choir-performance` | Coro / Presentación Coral | `#7C3AED` | `people` |
| `art-exhibition` | Exposición de Arte | `#D946EF` | `color-palette` |
| `theater-play` | Obra de Teatro | `#B45309` | `film` |
| `dance-performance` | Presentación de Baile | `#EC4899` | `body` |
| `comedy-show` | Stand-Up / Show Cómico | `#F59E0B` | `happy` |
| `poetry-slam` | Poesía / Slam Poetry | `#6366F1` | `book` |
| `film-screening` | Proyección de Película | `#1E293B` | `videocam` |
| `cultural-festival` | Festival Cultural | `#DC2626` | `flag` |
| `art-music-gathering` | Velada Arte & Música | `#C084FC` | `color-palette` |

---

## Categoría: `volunteer` — Voluntariado

| id | label | color | icon |
|----|-------|-------|------|
| `environmental-cleanup` | Limpieza Ambiental | `#16A34A` | `leaf` |
| `tree-planting` | Siembra de Árboles | `#15803D` | `leaf` |
| `animal-rescue` | Rescate y Adopción Animal | `#F97316` | `paw` |
| `food-bank` | Banco de Alimentos / Comedor | `#EAB308` | `fast-food` |
| `community-build` | Construcción Comunitaria | `#B45309` | `hammer` |
| `tutoring-education` | Tutoría / Educación | `#3B82F6` | `book` |
| `medical-campaign` | Campaña Médica / Salud | `#EF4444` | `medkit` |
| `blood-donation` | Donación de Sangre | `#DC2626` | `heart` |
| `clothing-drive` | Colecta de Ropa / Insumos | `#8B5CF6` | `shirt` |
| `elderly-support` | Apoyo a Adultos Mayores | `#F59E0B` | `people` |
| `children-support` | Apoyo a Niños | `#EC4899` | `happy` |
| `disability-support` | Apoyo a Personas con Discapacidad | `#6366F1` | `accessibility` |
| `disaster-relief` | Ayuda en Desastres | `#EF4444` | `alert` |
| `habitat-restoration` | Restauración de Hábitat | `#16A34A` | `earth` |
| `fundraiser-walk` | Caminata / Carrera Benéfica | `#10B981` | `footsteps` |
| `beach-cleanup` | Limpieza de Playa / Río | `#0EA5E9` | `water` |
| `digital-literacy` | Alfabetización Digital | `#3B82F6` | `laptop` |
| `mental-health-awareness` | Salud Mental / Concienciación | `#A855F7` | `heart` |
| `social-housing` | Apoyo de Vivienda Social | `#D97706` | `home` |
| `youth-mentorship` | Mentoría Juvenil | `#06B6D4` | `school` |

### ONGs, causas sociales & comunidades

| id | label | color | icon |
|----|-------|-------|------|
| `lgbt-awareness` | Comunidad LGBT+ | `#F472B6` | `heart` |
| `political-youth` | Juventud Política | `#6366F1` | `megaphone` |
| `university-awareness` | Conciencia Universitaria | `#3B82F6` | `school` |
| `ong-campaign` | Campaña ONG | `#10B981` | `ribbon` |
| `human-rights` | Derechos Humanos | `#EF4444` | `people` |
| `womens-rights` | Derechos de la Mujer | `#EC4899` | `female` |
| `indigenous-rights` | Pueblos Indígenas | `#D97706` | `earth` |
| `migrant-support` | Apoyo a Migrantes | `#F59E0B` | `airplane` |
| `anti-corruption` | Transparencia / Anticorrupción | `#64748B` | `shield` |
| `climate-activism` | Activismo Climático | `#16A34A` | `thunderstorm` |
| `disability-rights` | Inclusión / Discapacidad | `#8B5CF6` | `accessibility` |
| `animal-rights` | Derechos Animales | `#F97316` | `paw` |
| `peace-culture` | Cultura de Paz | `#06B6D4` | `globe` |
| `civic-education` | Educación Cívica | `#0EA5E9` | `book` |
| `social-entrepreneurship` | Emprendimiento Social | `#84CC16` | `bulb` |

---

## Categoría: `general` — General

| id | label | color | icon |
|----|-------|-------|------|
| `networking-event` | Networking / Conexiones | `#3B82F6` | `people` |
| `startup-pitch` | Pitch / Demo Day Startup | `#8B5CF6` | `rocket` |
| `workshop-skills` | Taller de Habilidades | `#F59E0B` | `build` |
| `conference-talk` | Conferencia / Charla | `#6366F1` | `mic` |
| `sports-game` | Partido Deportivo / Liga | `#10B981` | `football` |
| `running-race` | Carrera / Maratón | `#16A34A` | `footsteps` |
| `yoga-wellness` | Yoga / Bienestar | `#A855F7` | `body` |
| `food-tasting` | Cata / Festival Gastronómico | `#EAB308` | `restaurant` |
| `craft-beer` | Cata de Cerveza Artesanal | `#D97706` | `beer` |
| `flea-market` | Mercadillo / Feria de Pulgas | `#F97316` | `storefront` |
| `farmers-market` | Mercado de Productores | `#84CC16` | `leaf` |
| `art-craft-fair` | Feria de Arte y Manualidades | `#EC4899` | `color-palette` |
| `book-club` | Club de Lectura | `#6366F1` | `book` |
| `language-exchange` | Intercambio de Idiomas | `#0EA5E9` | `chatbubbles` |
| `gaming-tournament` | Torneo de Videojuegos | `#8B5CF6` | `game-controller` |
| `board-games` | Noche de Juegos de Mesa | `#F59E0B` | `dice` |
| `tech-meetup` | Meetup de Tecnología | `#3B82F6` | `code-slash` |
| `photography-walk` | Salida Fotográfica | `#1E293B` | `camera` |
| `hiking-outdoors` | Senderismo / Actividad al Aire Libre | `#16A34A` | `trail-sign` |
| `spiritual-retreat` | Retiro Espiritual / Meditación | `#7C3AED` | `sparkles` |
| `trivia-quiz` | Trivia / Quiz Night | `#F59E0B` | `help-circle` |
| `hackathon` | Hackathon / Maratón de Código | `#06B6D4` | `terminal` |
| `graduation-ceremony` | Graduación / Ceremonia | `#D97706` | `school` |
| `launch-party` | Lanzamiento de Producto / App | `#8B5CF6` | `rocket` |
| `private-party` | Fiesta Privada / Cumpleaños | `#EC4899` | `balloon` |

---

## Notas de implementación

### Uso en código

```typescript
// Catálogo completo en SubcategorySelector.tsx
export const SUBCATEGORIES: Subcategory[] = [
  { id: 'rock-concert', label: 'Concierto Rock', category: 'music', color: '#8B5CF6', icon: 'musical-notes' },
  // ...
];

// Filtrar por categoría activa
const filtered = SUBCATEGORIES.filter(s => s.category === activeCategory || activeCategory === 'all');
```

### Reglas de negocio

- **Un solo valor**: `subcategory` es un campo `TEXT` (no array). Permite filtrado preciso.
- **Opcional**: Usuarios pueden publicar sin subcategoría; valor `NULL` en DB.
- **Filtros de feed**: El algoritmo puede filtrar `subcategory = 'rock-concert'` para recomendaciones.
- **Tags complementan**: Un evento de `rock-concert` puede tener tags `['outdoor', '18+', 'bares']`.

### Diferencia subcategory vs tags

```
subcategory = 'electronic-concert'   → tipo de evento (filtrable, único)
tags = ['outdoor', '18+', 'bar', 'festival'] → contexto adicional (multi-valor)
```

### Colores por categoría padre

```
music     → gama morado/magenta  (#8B5CF6 → #EC4899)
volunteer → gama verde/naranja   (#16A34A → #F97316)
general   → gama azul/amarillo   (#3B82F6 → #F59E0B)
```
