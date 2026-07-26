# CLAUDE.md — Garden College Web Pública

## Proyecto
Web pública (onepage) para Garden College, La Unión, Chile.
Stack: Next.js 16 (App Router), TypeScript, TailwindCSS. **Sin base de datos.**
Deploy: Vercel, con `git push` a `main`. Dominio: https://gardenlaunion.cl

> El panel de administración **no existe**: se retiró el código a medias que
> había (ver `docs/DEPLOY_VERCEL.md`). La especificación sigue vigente en
> `docs/admin/REQUISITOS.md` para el día que alguien del colegio necesite
> publicar sin desarrollador.

---

## REGLAS NO NEGOCIABLES

### 1. Seguridad
- **NUNCA** hardcodear credenciales, tokens, o secrets en código. Todo va en `.env`.
- **NUNCA** exponer datos de estudiantes, apoderados o menores de edad. Este proyecto maneja SOLO datos públicos del colegio (noticias, galería, info institucional).
- Si algún requerimiento implica procesar datos personales de menores, **RECHAZAR** y señalarlo.
- Validar inputs en servidor. Nunca confiar en validación client-side.
- Las cabeceras de seguridad las emite `next.config.js` → `headers()`. Antes las
  ponía nginx; en Vercel no hay nginx delante.
- Si algún día vuelve un panel admin: toda su API requiere autenticación, y el
  HTML de cualquier editor WYSIWYG se sanitiza antes de almacenar.

### 2. Aprobación Humana de IA
- Si en el futuro se integra generación de contenido por IA (Etapa 3), **TODO** contenido generado DEBE pasar por flujo de aprobación antes de publicarse.
- Nunca implementar publicación automática de contenido generado por IA.

### 3. SaaS-Ready (Multi-tenant futuro)
- **NUNCA** hardcodear datos específicos de Garden College en lógica de negocio o componentes.
- Usar `src/content/config.ts` (key-value en archivo) para: nombre del colegio, misión, visión, teléfonos, colores, logo, etc.
- Los componentes reciben datos por props o fetch, nunca tienen strings del colegio escritos directamente.
- Quedan strings hardcodeados en Hero, Navbar y Footer — pendiente registrado en `docs/admin/REQUISITOS.md`.

### 4. Estático-First (requisito de Vercel, no una preferencia)
- **Ninguna página puede renderizarse en runtime.** Las páginas leen las fotos y
  videos con `fs` desde `public/media/`, y en Vercel esa carpeta se sirve por CDN
  y NO viaja dentro del bundle de la función serverless. Una página con ISR o SSR
  encuentra las carpetas vacías y se publica sin fotos, **sin ningún error en los
  logs**.
- Prohibido agregar `export const revalidate` o volver dinámica una página que
  lea medios. Ver `docs/DEPLOY_VERCEL.md` → "Por qué el sitio es 100% estático".
- Chequeo: en `npm run build`, la única ruta `ƒ (Dynamic)` debe ser `/api/contacto`.
- No se pierde nada: el contenido sólo cambia con un push, y cada push construye.

---

## ARQUITECTURA

```
garden-web/
├── CLAUDE.md                    # Este archivo
├── next.config.js               # Imágenes, cabeceras de seguridad, redirect www
├── src/
│   ├── app/
│   │   ├── (public)/            # Onepage pública (estática)
│   │   ├── eventos/[slug]/      # Subpáginas de eventos (SSG)
│   │   ├── documentos/          # Centro de documentación (estática)
│   │   ├── api/contacto/        # Única API route: POST del formulario
│   │   ├── sitemap.ts           # sitemap.xml generado en el build
│   │   ├── robots.ts            # robots.txt (bloquea previews de Vercel)
│   │   ├── layout.tsx           # Root layout + metadata base + JSON-LD
│   │   └── globals.css          # Tailwind + variables CSS
│   ├── components/
│   │   ├── public/sections/     # Secciones de la onepage
│   │   ├── public/shared/       # Galerías, formulario, JsonLd
│   │   └── public/ui/           # Componentes base reutilizables
│   ├── content/                 # ← EL CONTENIDO DEL SITIO (textos y eventos)
│   │   ├── config.ts            # Textos por clave "grupo.campo"
│   │   └── eventos.ts           # Eventos; los años salen de las carpetas
│   ├── data/                    # Redes sociales, recursos externos
│   └── lib/
│       ├── seo.ts               # URL canónica + datos estructurados JSON-LD
│       ├── eventos.ts           # Consultas sobre el contenido + años por carpeta
│       ├── media.ts             # Lectura de public/media/ + alt de imágenes
│       ├── mail.ts              # Envío SMTP del formulario
│       ├── anti-spam.ts         # Honeypot + verificación MX
│       └── utils.ts             # Helpers
├── public/
│   ├── media/                   # Fotos y videos por sección
│   ├── documentos/              # PDF institucionales
│   └── og-image.jpg             # Tarjeta de redes sociales
├── scripts/
│   ├── generar-og-image.js      # Regenera og-image.jpg (se corre a mano)
│   └── probar-smtp.js           # Verifica el correo del formulario de contacto
├── .env.example                 # Template de variables
└── docs/
    ├── README.md                    # Índice de documentación
    ├── CONTENIDO.md                 # Dónde se edita cada texto/foto del sitio
    ├── EVENTOS.md                   # Reglas para agregar y mantener eventos
    ├── DEPLOY_VERCEL.md             # Publicación, variables, qué se eliminó
    ├── SEO.md                       # Metadatos y datos estructurados
    ├── SETUP_DEV.md                 # Setup entorno local
    ├── UX_CONTEXT.md                # Informe UX/UI completo
    ├── PERFORMANCE_AUDIT.md         # Auditoría de rendimiento
    └── admin/                       # Spec del panel — NO implementado
        ├── README.md
        ├── BLUEPRINT_EVENTOS.md     # Referencia canónica de eventos
        ├── REQUISITOS.md            # Checklist de implementación del admin
        ├── GALERIAS.md              # Arquitectura de componentes de galería
        └── SELLOS.md                # Guía editorial sección Sellos (ex Convivencia)
```

### Rutas del sitio (todas estáticas, generadas en el build)
- `/` → Onepage completa
- `/eventos/[slug]` → Subpágina de un evento publicado. `dynamicParams = false`:
  un slug que no esté en `generateStaticParams()` es 404 directo.
- `/documentos` → Centro de documentación. El `?doc=` se resuelve en el cliente
  para no volver la página dinámica.
- `/sitemap.xml`, `/robots.txt` → generados desde el contenido real.

### API routes
- `POST /api/contacto` → Recibir mensaje del formulario. Público, con honeypot,
  verificación MX del dominio y rate limit best-effort (ver `docs/DEPLOY_VERCEL.md`).
- **Es la única.** No agregar rutas API que lean `public/` con `fs`: en la
  función serverless esa carpeta no existe.

---

## STACK Y DEPENDENCIAS

### Core
- `next` (16.x) — Framework
- `react`, `react-dom` (18.x+)
- `typescript`
- `tailwindcss` — Estilos

### Utilidades
- `sharp` — Lee dimensiones de imagen en el build (galerías masonry).
- `zod` — Validación del payload de `/api/contacto`.
- `nodemailer` — Envío SMTP del formulario.
- `date-fns` — Formateo de fechas en español.
- `react-photo-album` + `yet-another-react-lightbox` — Galerías.

> Requiere **Node.js 20+** (fijado en `package.json` → `engines`). Next 16 no
> corre en 18.

### Evitar
- **NO** usar `styled-components`, `emotion`, o CSS-in-JS. Solo Tailwind + CSS modules si es necesario.
- **NO** reintroducir una base de datos ni un ORM. El contenido vive en `src/content/` y en git.
- **NO** instalar component libraries pesadas (MUI, Ant Design, Chakra). Componentes propios con Tailwind.
- **NO** usar `localStorage` o `sessionStorage` para estado persistente. Estado en servidor + React state.
- **NO** usar `moment.js`. Usar `date-fns` o Intl nativo si se necesita formateo de fechas.

---

## IDENTIDAD VISUAL — GARDEN COLLEGE

### Paleta de colores (derivada del escudo del colegio)
```css
:root {
  /* Primarios — del escudo */
  --gc-gold: #C5A835;           /* León dorado — acento principal */
  --gc-gold-light: #D4BC5E;
  --gc-gold-dark: #9E8529;
  --gc-navy: #1B2A4A;           /* Azul oscuro — textos, headers */
  --gc-navy-light: #2D4470;
  --gc-red: #C62828;            /* Rojo — acentos secundarios, CTA */
  --gc-red-light: #E53935;

  /* Neutros */
  --gc-white: #FAFAF8;          /* Fondo principal (no blanco puro) */
  --gc-cream: #F5F0E8;          /* Fondo alternativo, secciones */
  --gc-gray-100: #F0EDE6;
  --gc-gray-200: #E0DCD4;
  --gc-gray-500: #8A8578;
  --gc-gray-700: #4A4640;
  --gc-gray-900: #2A2825;

  /* Semánticos */
  --gc-success: #2E7D32;
  --gc-warning: #F57F17;
  --gc-error: #C62828;
  --gc-info: #1565C0;
}
```

### Tipografía
- **Headings:** Variable, con carácter. Sugerir: `DM Serif Display`, `Playfair Display`, o `Lora`. NUNCA usar Inter, Roboto, Arial para títulos.
- **Body:** Legible, limpia. Sugerir: `Source Sans 3`, `IBM Plex Sans`, o `Nunito Sans`.
- **Accents/badges:** La misma del body en weight diferente.
- Cargar desde Google Fonts via `next/font/google` (auto-optimizado por Next.js).

### Tono visual
- **Cálido y profesional**, no corporativo frío.
- Fotos de actividades del colegio como hero images (no stock).
- El león dorado del escudo es el elemento icónico — usarlo como motivo sutil.
- Evitar estética de "plantilla de WordPress". Cada sección debe sentirse diseñada intencionalmente.
- Mobile first: los apoderados usan celular. Todo se diseña primero para 375px.

### Componentes UI — Principios
- Bordes redondeados suaves (8-12px), no sharp ni excesivamente round.
- Sombras sutiles para elevación, no box-shadow agresivos.
- Transiciones en hover/focus (200-300ms ease).
- Cards con imagen + contenido, no listas planas.
- Botones con estados claros: default, hover, active, disabled, loading.

---

## CONVENCIONES DE CÓDIGO

### TypeScript
- Strict mode activado.
- Interfaces con prefijo `I` solo si hay conflicto de nombres. Preferir sin prefijo.
- Tipos en `src/types/index.ts` para compartidos, colocados junto al componente para locales.
- Usar `satisfies` cuando sea útil para type-checking sin widening.

### Componentes React
- Functional components con arrow functions.
- Props tipadas inline para componentes simples, tipo extraído para componentes complejos.
- Server Components por defecto. `"use client"` solo cuando sea necesario (interactividad).
- Nombrar archivos en PascalCase: `Hero.tsx`, `NoticiaCard.tsx`.

### Contenido
- Los textos van en `src/content/config.ts` con claves `grupo.campo`, en español.
- Los eventos van en `src/content/eventos.ts`. Los años de galería NO se declaran:
  salen de las carpetas bajo `public/media/eventos/<slug>/`.

### Commits
- En español.
- Formato: `tipo: descripción breve`
- Tipos: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `security`
- Ejemplo: `feat: agregar datos estructurados JSON-LD del colegio`

### Archivos de imagen
- Subidas: guardar en `/public/uploads/{año}/{mes}/` en dev, migrar a Object Storage en prod.
- **Aceptar lo que sube la gente de verdad**, no solo jpg/png/webp: también HEIC/HEIF
  (default de iPhone) y RAW/DNG. Normalizar TODO a webp en el server.
- Pipeline: auto-rotar por EXIF (`sharp().rotate()`), resize máx 1600px, webp calidad ~72;
  generar thumbnail (max 400px ancho). HEIC necesita puente `heif-convert` (sharp no lo
  decodifica en este entorno). Descartar el original tras convertir.
- Tamaño máximo de subida: ~30 MB (HEIC/RAW de celular pasan los 5 MB; se comprime en server).
- Spec completo del pipeline del admin: `docs/admin/REQUISITOS.md` → "Subida de archivos".

---

## SECCIONES DE LA ONEPAGE

El orden y contenido de cada sección se basa en el PEI del colegio y el análisis de la web actual:

### 1. Hero
- Imagen de fondo: actividad escolar real (no stock)
- Logo del colegio
- Headline: editable desde `src/content/config.ts`
- Subheadline: slogan o frase corta
- CTA primario: "Proceso de Admisión" → sección admisión
- CTA secundario: "Conoce nuestro colegio" → scroll

### 2. Quiénes Somos
- Misión y Visión (desde `src/content/config.ts`)
- Breve párrafo institucional
- Dato de fundación: 2004, La Unión
- Asociado a Educación Adventista desde 2019

### 3. Sellos
- **SECCIÓN ESPECIAL** — punto fuerte del colegio.
- Fusiona los antiguos "Sellos Educativos" (que vivían dentro de Quiénes Somos)
  con "Convivencia y Valores". Se unificaron porque decían lo mismo dos veces:
  el sello de Formación Cristiana absorbió el pilar "Fe que transforma".
- Estructura: declaración → mosaico de cards → CTA de cierre.
- **NO publicar métricas de denuncias de bullying ni similares.** Se retiraron a
  propósito: son datos verificables que dependen de factores fuera del control
  del colegio, y publicarlos los convierte en una promesa que puede envejecer mal.
  Si alguien pide reponerlos, señalar este punto.
- El mosaico incluye una card visual con carrusel de fotos (sin link).
- Todo el contenido sale de `sellos.*` en `src/content/config.ts`. El orden de
  `sellos.cards` define el mosaico: la primera card es la destacada.
- La antigua página `/convivencia` fue eliminada.

### 4. Niveles Educativos
- Parvularia (Pre-Kínder, Kínder) — Sede Los Carrera 387
- Básica (1° a 6°) — Sede Los Carrera 387
- Básica-Media (7° a 8°) — Sede Caupolicán 967
- Media (1° a 4° Medio) — Sede Caupolicán 967
- Mencionar: JEC, PIE, talleres

### 5. Historias / Eventos
- Grid de últimas 3-6 historias (cards) + una destacada como hero
- Contenido desde `src/content/eventos.ts`; cada uno tiene su subpágina en
  `/eventos/[slug]`. Ver `docs/EVENTOS.md`.

### 6. Galería
- Álbumes recientes (carousel o grid)
- Thumbnails optimizados
- Lightbox para ver fotos grandes

### 7. Admisión
- Info del proceso (editable)
- Link al SAE del Mineduc (abre en nueva pestaña, NO saca al usuario del sitio sin aviso)
- CTA de contacto

### 8. Contacto
- Dos sedes con dirección y teléfono
- Mapa (Leaflet con OpenStreetMap, NO Google Maps — evitar API key y costo)
- Formulario: nombre, email, teléfono (opcional), asunto, mensaje
- Rate limit en el endpoint: max 5 mensajes por IP por hora

### 9. Footer
- Logo + nombre + "Corporación Educacional Filadelfia Garden"
- Links a secciones
- Redes sociales (Facebook, Instagram, YouTube)
- Link a documentos/reglamentos (página separada o acordeón)

---

## CONTENIDO — REGLAS

> **El contenido NO vive en base de datos.** Vive en archivos del repo:
> `src/content/config.ts` (textos) y `src/content/eventos.ts` (eventos).
> Se edita, se commitea, y el deploy publica. Sin panel, sin seed, sin migración.
>
> Guías: [docs/CONTENIDO.md](docs/CONTENIDO.md) y [docs/EVENTOS.md](docs/EVENTOS.md).
>
> Razón: hay un solo editor y sabe código. Git ya da historial y rollback. Un
> panel se justifica el día que alguien del colegio necesite publicar sin
> desarrollador — no antes. La spec del panel sigue vigente en
> `docs/admin/REQUISITOS.md` para ese día.

### Claves de contenido (`src/content/config.ts`)
Claves usan formato `grupo.campo`:
```
institucional.nombre_colegio
institucional.slogan
institucional.mision
institucional.vision
institucional.resena
sellos.titulo
sellos.descripcion
sellos.cta (JSON — {cifra, texto, boton, href}; CTA de cierre de la sección)
sellos.cards (JSON array — {titulo, descripcion, icono}; el orden define el mosaico)
contacto.sede_basica.direccion
contacto.sede_basica.telefono
contacto.sede_media.direccion
contacto.sede_media.telefono
contacto.email
redes.facebook
redes.instagram
redes.youtube
admision.info
admision.link_sae

```

### Backups
- **Git ES el backup.** No hay base de datos: el contenido, las fotos y los
  documentos están versionados en el repositorio, con historial y rollback.
- Vercel guarda cada deploy y permite volver a uno anterior desde el dashboard.

---

## TESTING

- Prioridad: que funcione y se pueda deployar rápido. Testing completo viene después.
- Mínimo: `npm run build` sin errores antes de pushear. Es lo que corre Vercel.
- Revisar en esa salida que la única ruta `ƒ (Dynamic)` sea `/api/contacto`.
- Probar en Chrome mobile emulation (375px) antes de considerar algo "listo".

---

## PERFORMANCE

- Imágenes: servir en webp. Next.js Image para optimización automática.
- **Todo el sitio se prerenderiza en el build** (ver regla no negociable #4). No
  hay ISR ni revalidación: el contenido sólo cambia con un push.
- La imagen de fondo del Hero en móvil es el LCP de la mayoría de las visitas:
  va con `fetchPriority="high"`.
- Lazy load para galería y secciones below the fold.
- Target: Lighthouse mobile > 80 en todas las métricas.

---

## SEO

Objetivo del sitio: ser el primer resultado en las búsquedas locales de gente
que busca colegio en La Unión. Detalle completo en **`docs/SEO.md`**.

- Los datos del colegio para Google (dirección, teléfonos, RBD, director,
  coordenadas, redes) salen de `src/content/config.ts` vía `src/lib/seo.ts`.
  **Nunca duplicarlos** en el JSON-LD ni en la metadata.
- `sitemap.xml` y `robots.txt` se generan del contenido real, no se escriben a
  mano. Los deploys de preview quedan bloqueados para buscadores.
- Toda página nueva declara su `alternates.canonical`.
- **Toda imagen lleva `alt` con sentido.** El nombre de archivo no es `alt`:
  usar `altDesdeArchivo()` de `src/lib/media.ts`, que descarta los volcados de
  cámara/WhatsApp y cae a un texto de contexto. `alt=""` sólo para imágenes
  decorativas, siempre junto a `aria-hidden`.
- Un `<h1>` por página, y que no repita un texto que ya está al lado.

---

## NOTAS PARA CLAUDE CODE

- El usuario es YoaOses, ingeniero informático. Comunicación directa en español chileno.
- Si algo no es seguro, decirlo aunque sea más trabajo.
- Si algo necesita revisión legal (ley de datos, ley de educación), señalarlo.
- Preferir soluciones simples sobre elegantes. Este proyecto lo mantiene una persona.
- Cuando haya duda entre rendimiento y simplicidad, elegir simplicidad.
- Nunca generar contenido placeholder tipo "Lorem ipsum" ni imágenes de stock
  externas. Usar datos y fotos reales del colegio; si no hay, no renderizar la
  sección. (Los placeholders de `picsum.photos` se retiraron por esto mismo.)
