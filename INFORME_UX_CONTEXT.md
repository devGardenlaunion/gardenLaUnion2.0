# Informe Técnico — Garden College Web
## Para: Especialista UX/UI que genera prompts para Claude Code

---

## 1. Identidad del Proyecto

**Cliente:** Garden College — Colegio particular subvencionado  
**Ubicación:** La Unión, Región de Los Ríos, Chile  
**Corporación:** Corporación Educacional Filadelfia Garden  
**Fundación:** 2004 — afiliado a Educación Adventista desde 2019  
**Tipo de web:** One-page pública (SSR/SEO) + panel de administración  
**Estado:** En construcción activa. Componentes de secciones ya implementados (scaffolding funcional, falta refinamiento visual).

---

## 2. Stack Técnico Completo

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.x (App Router, TypeScript strict) |
| Estilos | TailwindCSS 3.4 + CSS custom properties |
| ORM | Prisma 5.x con PostgreSQL |
| Auth | NextAuth v4 (Google OAuth 2.0) |
| Imágenes | `next/image` + `sharp` para thumbnails |
| Galería | `react-photo-album` + `yet-another-react-lightbox` |
| Mapas | Leaflet + OpenStreetMap (NO Google Maps) |
| Formularios | Zod para validación server-side |
| Deploy | Docker en Oracle Cloud ARM64 (Ampere A1) |

**Fuentes cargadas con `next/font/google`:**
- `Lora` → `var(--font-lora)` → clase Tailwind `font-display` (headings)
- `Source Sans 3` → `var(--font-source-sans)` → clase Tailwind `font-body` (body)

---

## 3. Paleta de Colores — Tokens Activos

Estos son los tokens **reales** usados en el código (no los del CLAUDE.md original — fueron refinados):

```css
/* Verde Jade — COLOR PROTAGONISTA */
--gc-green-50:    #EBF5F3   /* fondos muy suaves */
--gc-green-100:   #B8DDD5   /* bordes suaves */
--gc-green-light: #5EAA9A   /* acentos claros */
--gc-green:       #3D8578   /* color base */
--gc-green-dark:  #2D6A5F   /* hover states */
--gc-green-800:   #1F4F46   /* textos, headings */
--gc-green-900:   #143832   /* footer, backgrounds oscuros */

/* Navy — BASE OSCURA */
--gc-navy-50:     #E8ECF2
--gc-navy-light:  #2D4470
--gc-navy:        #1B2A4A   /* navbar scrolled, border */
--gc-navy-dark:   #111B33

/* Dorado — ACENTO + CTA PRINCIPAL */
--gc-gold-50:     #FAF6EB
--gc-gold-light:  #D4B84E
--gc-gold:        #B8943B   /* buttons, badges, íconos */
--gc-gold-dark:   #7A6A2E   /* hover dorado */

/* Rojo — SOLO errores y alertas */
--gc-red:         #C62828
--gc-red-light:   #E53935

/* Neutros */
--gc-white:       #FAFAF8   /* fondo principal (no puro) */
--gc-cream:       #F7F4ED   /* secciones alternas */
--gc-gray-100 a 900         /* escala de grises cálidos */
```

**Regla clave de color para prompts:**
- El **verde jade** (`gc-green`) es el color protagonista del sitio. El CLAUDE.md menciona gold como principal, pero en el código el verde domina texto, bordes y fondos de sección.
- El **dorado** (`gc-gold`) se usa para badges, CTAs, íconos destacados y acentos.
- El **navy** (`gc-navy`) aparece en navbar scrolled y algunos bordes.
- El **rojo** está **reservado exclusivamente** para errores. No usar en diseño decorativo.

---

## 4. Clases Utilitarias Globales Disponibles

Definidas en `globals.css` y usables en cualquier componente:

```css
.container-gc      /* max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 */
.btn-primary       /* fondo gc-gold, texto blanco, rounded-xl, hover gc-gold-dark */
.btn-secondary     /* borde gc-green-800, texto gc-green-800, fill en hover */
.btn-ghost         /* transparente, texto gc-green-800/70 */
.card              /* bg-white rounded-2xl shadow-sm, hover border gc-green/20 */
.section-alt       /* bg-gc-cream — secciones alternas */
.section-heading   /* text-3xl→5xl font-display font-bold text-gc-green-800 */
.section-subheading /* text-lg text-gc-green-800/60 font-body max-w-2xl */
.badge-gold        /* pill bg-gc-gold/10 text-gc-gold-dark border-gc-gold/20 */
.badge-navy        /* pill bg-gc-navy/10 text-gc-navy border-gc-navy/20 */
```

---

## 5. Arquitectura de Componentes

### 5.1 Estructura de archivos relevante para UX

```
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx          ← Orquestador principal (Server Component)
│   ├── eventos/[slug]/       ← Detalle de evento
│   ├── convivencia/          ← Página standalone de convivencia
│   └── documentos/           ← Reglamentos y documentos institucionales
├── components/
│   ├── public/
│   │   ├── sections/         ← SECCIONES DE LA ONEPAGE (un archivo por sección)
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── QuienesSomos.tsx
│   │   │   ├── Sellos.tsx
│   │   │   ├── Convivencia.tsx
│   │   │   ├── EventosDestacados.tsx
│   │   │   ├── Galeria.tsx
│   │   │   ├── Niveles.tsx
│   │   │   ├── Noticias.tsx
│   │   │   ├── Admision.tsx
│   │   │   ├── Contacto.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/           ← COMPONENTES REUTILIZABLES
│   │       ├── InfoCard.tsx
│   │       ├── GaleriaPolaroid.tsx
│   │       ├── GaleriaColumnas.tsx
│   │       ├── CarouselLinkCard.tsx
│   │       ├── ContactForm.tsx
│   │       ├── EventModal.tsx
│   │       └── DocumentViewer.tsx
│   └── admin/                ← Panel de administración
```

### 5.2 Patrón de datos en componentes

Todos los textos editables vienen de `ConfigSitio` (BD key-value). Los componentes **nunca tienen strings del colegio hardcodeados**, los reciben por props desde `page.tsx`.

El page principal (`(public)/page.tsx`) es Server Component que:
1. Hace `getConfig()` → obtiene todos los ConfigSitio de la BD
2. Hace `getMediaImages()` / `getMediaCover()` → lee imágenes de `/public/media/`
3. Pasa props a cada sección

**Implicación para UX:** Cualquier texto, imagen o dato que el diseño requiera mostrar puede venir de la BD. No hay restricción de contenido por hardcoding.

---

## 6. Secciones Actuales — Estado y Props

### Orden en la onepage:

| # | Sección | ID Anchor | Fondo | Estado |
|---|---------|-----------|-------|--------|
| 1 | Navbar | — | Transparente → white/95 | ✅ implementado |
| 2 | Hero | `#inicio` | Video/imagen + overlay gc-green-900/85 | ✅ implementado |
| 3 | Quiénes Somos | `#quienes-somos` | Blanco | ✅ implementado |
| 4 | Sellos Educativos | `#sellos` | gc-cream (section-alt) | ✅ implementado |
| 5 | Convivencia y Valores | `#convivencia` | Blanco | ✅ implementado |
| 6 | Eventos Destacados | `#eventos` | Variable | ✅ implementado |
| 7 | Galería | `#galeria` | gc-cream | ✅ implementado |
| 8 | Niveles Educativos | `#niveles` | Blanco | ✅ implementado |
| 9 | Noticias | `#noticias` | gc-cream | ✅ implementado |
| 10 | Admisión | `#admision` | gc-cream | ✅ implementado |
| 11 | Contacto | `#contacto` | Blanco | ✅ implementado |
| 12 | Footer | — | gc-green-900 | ✅ implementado |

### Props de cada sección (contrato de API del componente):

**Hero:**
```ts
{ nombre: string; slogan: string; mision: string; imagenMobile?: string }
// Usa video /media/Hero/heroShort.webm en desktop, imagen en mobile portrait
```

**QuienesSomos:**
```ts
{ mision: string; vision: string; resena: string; fotos?: FotoPolaroid[] }
// Layout 2 columnas: texto (misión+visión) | galería polaroid
// Datos institucionales fijos: 2004, 2019, Pre-K→4°M, 2 sedes
```

**Sellos:**
```ts
{ sellos: Array<{ titulo: string; descripcion: string; icono: string }> }
// 3 cards fijas: "vida_saludable" | "formacion_cristiana" | "ingles"
// Iconos SVG inline disponibles: "heart-pulse" | "book-open" | "globe"
```

**Convivencia:**
```ts
{
  titulo: string;
  descripcion: string;
  logros: Array<{ cifra: string; descripcion: string }>;
  pilares: Array<{ titulo: string; descripcion: string }>;
  testimonio: { texto: string; nombre: string; rol: string; iniciales: string } | null;
}
// Usa CarouselLinkCard con imágenes de /media/carousel-cards/convivencia/
```

**EventosDestacados:**
```ts
// Server Component — sin props, fetch directo a BD
// Muestra ediciones destacadas agrupadas por Evento
// EventModal para navegación entre ediciones de un mismo evento
```

**Galeria:**
```ts
// Server Component — sin props, lee /public/media/Galeria/ con sharp
// Usa GaleriaColumnas (masonry) + lightbox
```

**Niveles:**
```ts
{
  niveles: Array<{ nombre: string; niveles: string; sede: string; descripcion: string; imagen?: string }>;
  extras: string[];
}
// 4 cards con borde izquierdo en degradado de verdes
```

**Noticias:**
```ts
// Server Component — sin props, fetch a BD (últimas 6 publicadas)
// Grid 3 columnas, card con imagen portada o placeholder ilustrado
```

**Admision:**
```ts
{ info: string; linkSae: string; imagen?: string }
// 2 columnas: info + CTA con imagen vertical
```

**Contacto:**
```ts
{
  sedes: Array<{ nombre: string; direccion: string; telefono: string; niveles: string }>;
  email: string;
}
// 5/12 info sedes + 7/12 formulario ContactForm
```

**Footer:**
```ts
{ nombre: string; corporacion: string; redes: { facebook?; instagram?; youtube? } }
// 4 columnas: logo+info | navegación | contacto | redes
// Fondo gc-green-900
```

---

## 7. Modelo de Datos (Prisma)

```prisma
// Tablas relevantes para el front público:

model ConfigSitio {  // key-value para todos los textos editables
  clave: String     // ej: "institucional.mision", "sellos.ingles.titulo"
  valor: String
  tipo: String      // "text" | "richtext" | "json" | "image"
  grupo: String     // "institucional" | "contacto" | "admision" | etc.
}

model Noticia {      // Noticias del colegio
  titulo, slug, extracto, contenido, imagenPortada
  estado: BORRADOR | PUBLICADA | ARCHIVADA
  destacada: Boolean
  categorias: Categoria[]
}

model Galeria {      // Álbumes fotográficos
  titulo, descripcion, fecha, visible, orden
  fotos: Foto[]     // url, thumbnail, alt, orden
}

model Evento {       // Eventos recurrentes (ej: "Día de la Familia")
  nombre, slug, recurrencia: "anual"
  ediciones: Edicion[]
}

model Edicion {      // Una ocurrencia de un Evento (con año)
  titulo, slug, extracto, contenido, imagenPortada, fecha
  estado: BORRADOR | PUBLICADA | ARCHIVADA
  multimedia: Multimedia[]  // tipo: "foto" | "video"
}

model MensajeContacto {  // Formulario de contacto
  nombre, email, telefono?, asunto, mensaje, leido
}
```

---

## 8. Reglas de Diseño No Negociables

### Restricciones para propuestas UX:

1. **Sin component libraries pesadas.** Solo Tailwind + componentes propios. No MUI, Chakra, Ant Design.
2. **Sin CSS-in-JS.** Solo Tailwind + CSS modules si es absolutamente necesario.
3. **Sin Google Maps.** Usar Leaflet + OpenStreetMap.
4. **Sin moment.js.** Solo `date-fns` o `Intl`.
5. **Mobile first obligatorio.** Breakpoint base: 375px. Los apoderados usan celular.
6. **Imágenes con `next/image`** para optimización automática. Excepciones solo donde se usa `<img>` con lazy load explícito.
7. **El rojo es solo para errores.** No usarlo como color decorativo en ningún diseño.
8. **Sin Lorem ipsum.** Cualquier placeholder de texto debe usar contenido real del colegio.
9. **ARM64 compatible.** Si un paquete npm se propone, debe tener build ARM64.
10. **Sin publicación automática de contenido.** Todo el CMS requiere aprobación humana.

### Principios visuales:
- Bordes redondeados: 8-16px (`rounded-xl` / `rounded-2xl`)
- Sombras: sutiles (`shadow-sm` en rest, `shadow-md` en hover)
- Transiciones: 200-300ms ease en hover/focus
- Focus visible: outline-2 outline-offset-2 outline-gc-gold (accesibilidad)
- Cards con imagen encima del contenido, no listas planas

---

## 9. Tipografía en Código

```tsx
// Disponible vía Tailwind:
className="font-display"  // Lora — headings, títulos de sección
className="font-body"     // Source Sans 3 — párrafos, labels, botones

// En CSS:
font-family: var(--font-lora)
font-family: var(--font-source-sans)
```

---

## 10. Cómo Claude Code Implementa Cambios

### Flujo de trabajo:
1. Claude lee los archivos relevantes antes de editar
2. Edita componentes existentes (no crea nuevos sin necesidad)
3. Usa los tokens de color ya definidos (`gc-green`, `gc-gold`, etc.)
4. Respeta el patrón Server Component → props al componente

### Cómo formular prompts efectivos para Claude Code:

**Estructura recomendada:**
```
Modifica [nombre del componente] en [ruta del archivo].
[Descripción del cambio visual deseado].
Usa los tokens de color gc-[color] ya definidos.
El componente recibe las props: [listar props relevantes].
Mantén el mismo patrón de layout [describe el patrón actual si cambia algo].
```

**Ejemplos de prompts bien formados:**

> "Modifica `src/components/public/sections/Hero.tsx`. Agrega un segundo CTA ghost bajo el primario que diga 'Ver noticias' y haga scroll a `#noticias`. Usa `btn-ghost` con texto blanco. Mantén el layout centrado actual."

> "En `src/components/public/sections/Sellos.tsx`, cambia las 3 cards InfoCard a un layout horizontal en desktop (icono a la izquierda, texto a la derecha). En mobile mantén el stack vertical actual. Usa las clases `card` y `gc-green-800` ya definidas."

> "Crea un nuevo componente `src/components/public/shared/StatCounter.tsx` que reciba `{ valor: string; etiqueta: string; color?: 'gold' | 'green' }` y muestre una cifra grande con etiqueta debajo. Úsalo en la sección Convivencia donde están los `logros`."

**Lo que NO funciona como prompt:**
- "Hazlo más bonito" → sin especificar qué elemento ni cómo
- "Rediseña el Hero" → sin especificar qué cambios concretos
- "Agrega animaciones" → sin especificar qué elemento, qué tipo, qué trigger

---

## 11. Páginas Standalone (no en la onepage)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/documentos` | `src/app/documentos/page.tsx` | Reglamentos y documentos en PDF |
| `/convivencia` | `src/app/convivencia/page.tsx` | Página extendida de convivencia |
| `/eventos/[slug]` | `src/app/eventos/[slug]/page.tsx` | Detalle de edición de evento |

La Navbar en estas páginas usa `variant="solid"` (siempre blanca, no transparente).

---

## 12. Medios y Assets

```
public/
└── media/
    ├── Hero/
    │   └── heroShort.webm    ← Video de fondo del hero
    ├── QuienesSomos/         ← Fotos de la sección quiénes somos
    ├── Niveles/              ← Fotos de cada nivel educativo
    ├── Admision/             ← Imagen sección admisión
    ├── Galeria/              ← Fotos de galería (leídas automáticamente)
    ├── eventos/[slug]/[year]/hero/  ← Portadas de eventos por año
    └── carousel-cards/
        └── convivencia/      ← Fotos para el carousel de convivencia
```

**Convención:** `getMediaCover("NombreCarpeta")` retorna la primera imagen de esa carpeta. `getMediaImages("NombreCarpeta")` retorna todas.

---

## 13. API Routes Disponibles

| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/api/noticias` | GET | No | Lista noticias publicadas |
| `/api/eventos` | GET | No | Lista eventos con ediciones publicadas |
| `/api/eventos/[slug]` | GET | No | Edición específica por slug |
| `/api/media/galeria` | GET | No | Lista imágenes de galería |
| `/api/contacto` | POST | No | Enviar mensaje (rate limit: 5/hora/IP) |
| `/api/health` | GET | No | Health check del sistema |
| `/api/auth/[...nextauth]` | * | — | NextAuth (Google OAuth) |

---

## 14. Limitaciones y Contexto para el Asesor UX

1. **Mantenedor único:** Este proyecto lo mantiene una sola persona (YoaOses, ingeniero informático). Las propuestas deben ser implementables sin equipo.

2. **No hay presupuesto de licencias:** Sin Figma Pro, sin servicios de pago para mapas, sin APIs de terceros costosas.

3. **Público objetivo real:**
   - Apoderados chilenos con celular Android de gama media
   - Potenciales apoderados buscando colegio en La Unión
   - Docentes y comunidad escolar

4. **Contenido real disponible:** Video del hero, fotos institucionales, logos, escudo del colegio con León dorado.

5. **Datos del PEI ya integrados en seed:** El contenido de misión, visión, sellos, niveles y convivencia es real, basado en el PEI del colegio.

6. **SaaS-ready:** La arquitectura está diseñada para poder reutilizarse en otros colegios. Ningún componente tiene strings del colegio escritos directamente.

7. **ISR activo:** La onepage se regenera cada 60 segundos. El panel admin invalida el cache al publicar.

---

## 15. Checklist para Prompts al Especialista UX → Claude Code

Al generar un prompt para Claude Code basado en sugerencias UX, verificar:

- [ ] ¿Especifica el archivo exacto a modificar? (`src/components/...`)
- [ ] ¿Usa los nombres de tokens de color correctos? (`gc-green-800`, no `#1F4F46`)
- [ ] ¿Menciona si es Mobile First? (¿qué se ve en 375px primero?)
- [ ] ¿El cambio afecta props del componente? (¿hay que cambiar la interfaz?)
- [ ] ¿Usa clases existentes? (`.card`, `.btn-primary`, `.section-heading`, etc.)
- [ ] ¿Evita librerías nuevas? (solo Tailwind + lo que ya está instalado)
- [ ] ¿Es reversible? (no rompe el patrón de Server Component → props)
- [ ] ¿El contenido es real, no Lorem ipsum?

---

*Generado el 2026-04-18 por Claude Code para uso del asesor UX/UI.*
*Fuente de verdad: código fuente en `/src/` + `CLAUDE.md` + `prisma/schema.prisma`*
