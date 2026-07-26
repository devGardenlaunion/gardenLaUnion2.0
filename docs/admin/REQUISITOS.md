# Panel Admin — Requisitos de Implementación

> Checklist completo. Leer [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) antes de
> implementar la sección de Eventos. Leer [GALERIAS.md](./GALERIAS.md) antes de
> implementar subida de multimedia. Leer [DOCUMENTOS.md](./DOCUMENTOS.md) antes de
> implementar el admin de documentos.

---

## Hardcodeo pendiente de eliminar

Antes de implementar el admin, hay datos que están hardcodeados en código y deben migrar a BD o ConfigSitio:

### Hero, Navbar y Footer — textos institucionales en el componente
Detectado en la revisión de SEO de julio 2026. Violan la regla no negociable #3
(SaaS-Ready): son strings de Garden College escritos dentro del componente.

```
Hero.tsx     "Desde 2004 en La Unión, Región de Los Ríos"          ← badge
Hero.tsx     "Educación integral con énfasis en inglés, vida       ← descripción
              saludable y valores cristianos. Prebásica a 4° Medio."
Navbar.tsx   "Corporación Educacional Filadelfia Garden"           ← barra superior
Navbar.tsx   "/media/Logo/cropped-cropped-logo.png"                ← ruta del logo
Footer.tsx   "La Unión, Provincia del Ranco / Región de Los Ríos"  ← ubicación
```

**Acción:** mover a `institucional.*` en `src/content/config.ts`. El dato de
`institucional.corporacion` y `institucional.ciudad` ya existe — sólo hay que
pasarlo por props como hacen las demás secciones.

**Prioridad media:** no rompe nada hoy (hay un solo colegio) y el texto es
correcto, pero son las frases con más peso SEO de la home y conviene poder
editarlas sin tocar TSX.

### `src/data/redes.ts` — eliminar el archivo completo
Las URLs de redes sociales están en este archivo Y en `ConfigSitio`.
La página `(public)/page.tsx` ya lee de ConfigSitio pero importa de `redes.ts` en algunas rutas.
**Acción:** Eliminar `redes.ts`. Asegurar que todas las rutas lean de ConfigSitio.

```
instagram: 'https://www.instagram.com/garden.launion'       ← mover a ConfigSitio
facebook:  'https://www.facebook.com/...'                   ← mover a ConfigSitio
youtube:   'https://www.youtube.com/@Garden.launion'        ← mover a ConfigSitio
whatsapp:  'PLACEHOLDER_WHATSAPP_URL'                       ← agregar a ConfigSitio
```

### `src/data/recursos.ts` — migrar a tabla propia en BD
Documentos y links externos hardcodeados, incluyendo el ID específico del colegio en el SAE:
```
url: 'https://admision.mineduc.cl/vitrina-vue/establecimiento/22743'
```
El número `22743` es el ID del colegio en el sistema Mineduc — hardcodeado en código.
**Acción:** Mover estos items a una tabla `RecursoExterno` en BD (ver sección `/admin/institucional`).
Permitir al admin agregar/editar/eliminar/reordenar recursos externos desde el panel.

### `src/components/public/sections/Recursos.tsx` — textos de sección hardcodeados
Los encabezados de la sección Recursos en la onepage están hardcodeados en el componente:
```
badge:    "Para la comunidad"
heading:  "Recursos y enlaces de interés"
subheading: "Accesos directos para la comunidad Garden College"
```
**Acción:** Agregar las siguientes claves a `ConfigSitio` y leerlas desde `page.tsx`:
```
recursos.badge        → "Para la comunidad"
recursos.titulo       → "Recursos y enlaces de interés"
recursos.subtitulo    → "Accesos directos para la comunidad Garden College"
```
El componente `Recursos` debe recibir estos tres valores como props.

### `src/app/documentos/page.tsx` — catálogo de documentos hardcodeado
La lista completa de ~20 documentos PDF (títulos, descripciones, categorías, URLs) está
hardcodeada en este archivo como un array TypeScript.
**Acción:** Migrar a tabla `Documento` en BD con CRUD desde el panel.
Ver [DOCUMENTOS.md](./DOCUMENTOS.md) para el blueprint completo.

### `src/app/eventos/[slug]/page.tsx` — textos UI hardcodeados
Strings en la UI que deberían venir de ConfigSitio:
```
"Galería"              ← heading de la sección galería de la edición
"Volver a Eventos"     ← link de navegación
"Ediciones anteriores" ← label de la sección de links a años previos
title: `${edicion.titulo} — Garden College`  ← "Garden College" hardcodeado
```
Los strings de navegación ("Volver a", "Ediciones anteriores") son menos críticos — están en español
y son genéricos. El título de metadata sí debería usar `config["institucional.nombre"]`.

### `src/app/eventos/[slug]/page.tsx` — inconsistencia Evento.descripcion vs Edicion.contenido
**Issue crítico de arquitectura:** La página actualmente renderiza `Evento.descripcion`
(campo del evento padre, compartido entre todas las ediciones) como texto narrativo de la
subpágina, ignorando `Edicion.contenido` (campo específico de la edición que el admin debe editar).

**Acción requerida al implementar el admin:**
1. Usar `Edicion.contenido` como el cuerpo de texto de la subpágina (renderizar como HTML sanitizado)
2. El editor WYSIWYG del admin debe apuntar a `Edicion.contenido`
3. `Evento.descripcion` se conserva en BD como referencia pero no se muestra en la web

---

## Migración requerida — antes de implementar subida de imágenes

Agregar dimensiones a `Multimedia` para que `GaleriaColumnas` funcione sin Sharp on-the-fly:

```prisma
model Multimedia {
  // campos existentes ...
  ancho  Int?   // ancho px de la imagen procesada (null para youtube)
  alto   Int?   // alto px de la imagen procesada (null para youtube)
}
```

```bash
npx prisma migrate dev --name add_multimedia_dimensions
```

---

## Autenticación

- [ ] NextAuth con Google OAuth 2.0
  - Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - Restringir a emails autorizados (env `ALLOWED_EMAIL_DOMAIN` o tabla `User` con `active: true`)
- [ ] Middleware que protege `/admin/**` → redirige a `/admin/login` si no hay sesión
- [ ] Página `/admin/login` — botón "Continuar con Google"
- [ ] Página `/admin/logout`

---

## Layout / Sidebar

- [ ] Layout compartido para todas las rutas `/admin/**`
- [ ] Sidebar: Dashboard · Noticias · Eventos · Galería · Institucional · Mensajes
- [ ] Header con nombre del usuario logueado y botón cerrar sesión
- [ ] Responsive: sidebar colapsable en móvil (hamburger)
- [ ] Indicador de sección activa en el sidebar
- [ ] Badge en sidebar con N mensajes no leídos

---

## Dashboard `/admin`

- [ ] Contador: N noticias publicadas, N eventos activos, N mensajes sin leer
- [ ] Accesos rápidos a cada sección
- [ ] Estado del sitio: última actualización de config, última noticia publicada

---

## Eventos `/admin/eventos`

> Ver [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) para el detalle completo.
> El modelo tiene dos niveles separados: el Evento (permanente) y la Galería Anual.

### Gestión del Evento (texto permanente)
- [ ] Listado de eventos: nombre, slug, galería activa, activo/inactivo
- [ ] Crear evento: nombre, slug (auto-generado, editable), activo
- [ ] **Editar evento** (se hace raramente — una vez al crear, raramente después):
  - Extracto (texto del blockquote destacado)
  - **Contenido** — editor WYSIWYG (Tiptap recomendado) → `Evento.contenido`
  - Imagen portada del hero (single upload, si no hay video permanente)
  - Estado (PUBLICADO / BORRADOR)
- [ ] El GaleriaPolaroid **no se gestiona desde el admin** — se actualiza reemplazando
  archivos en `public/media/eventos/[slug]/polaroid/` (acción del desarrollador)

### Gestión de la Galería Anual
- [ ] Listado de galerías por evento: año, N fotos, N videos, estado, activa/historial
- [ ] **Crear galería anual:**
  - Solo el **año** (campo entero: `2026`, `2027`…) — sin mes, sin día
  - Estado (BORRADOR / PUBLICADA)
- [ ] Al publicar una nueva galería → marcar como `activa: true`, la anterior pasa a `activa: false`
- [ ] Galerías anteriores quedan en BD con `activa: false` — conservadas pero sin acceso público por ahora
- [ ] Historial de galerías pasadas: **pendiente de decidir formato** (lista de años, descargable, página de historial)

### Subida de multimedia de la galería anual
- [ ] Upload múltiple de fotos → pipeline Sharp → guardar en `Multimedia` con `ancho` y `alto`
- [ ] Upload de videos → auto-generar thumbnail con ffmpeg → guardar en `Multimedia`
- [ ] Reordenar multimedia (drag & drop o campo orden numérico)
- [ ] Eliminar foto/video con confirmación
- [ ] Agregar link de YouTube → `Multimedia` con `tipo: "youtube"`

### Migración requerida del schema
El schema actual usa `Edicion` (con título, contenido, fecha, slug por año) — modelo anterior.
El modelo objetivo separa el texto del evento (permanente) de la galería anual.
Decidir y ejecutar esta migración antes de implementar el admin de eventos.

---

## Noticias `/admin/noticias`

- [ ] Listado con paginación: título, estado, fecha, acciones
- [ ] Crear noticia: título, slug (auto desde título, editable), extracto, contenido WYSIWYG, imagen portada, estado
- [ ] Editar noticia existente
- [ ] Eliminar con confirmación
- [ ] Toggle publicar/despublicar desde el listado
- [ ] Editor WYSIWYG: `@tiptap/react` (tiene build ARM64)
- [ ] Sanitizar HTML antes de guardar (`isomorphic-dompurify`)
- [ ] Subir imagen portada → pipeline → guardar URL en BD

---

## Galería General `/admin/galeria`

- [ ] Listado de álbumes: título, N fotos, fecha, visible/oculto
- [ ] Crear / editar álbum: nombre, descripción, fecha, portada, visible
- [ ] Subir fotos a un álbum (multiple upload) → pipeline de imágenes
- [ ] Reordenar fotos dentro del álbum
- [ ] Eliminar foto con confirmación

---

## Configuración Institucional `/admin/institucional`

Edición de claves `ConfigSitio` agrupadas por sección.
Cada grupo es una sub-pantalla o acordeón dentro de `/admin/institucional`.

- [ ] **Institucional:** nombre del colegio, slogan, misión, visión, reseña, corporación, ciudad
- [ ] **Sellos educativos:** título, descripción e ícono de cada sello (Vida Saludable, Inglés, Formación Cristiana)
- [ ] **Convivencia:** título, descripción, logros (lista editable), pilares, testimonio
  - Ver [SELLOS.md](./SELLOS.md) para guía editorial
- [ ] **Eventos:** título de sección (`eventos.titulo`), subtítulo (`eventos.subtitulo`), badge (`eventos.badge`)
- [ ] **Galería:** título de sección (`galeria.titulo`), badge (`galeria.badge`)
- [ ] **Recursos:** badge (`recursos.badge`), título de sección (`recursos.titulo`), subtítulo (`recursos.subtitulo`)
  - Los ítems de la lista de recursos son una tabla propia — ver sección "Recursos externos" abajo
- [ ] **Admisión:** texto informativo (`admision.info`), link al SAE del Mineduc (`admision.link_sae`)
- [ ] **Contacto:** sedes (nombre, dirección, teléfono, niveles por sede), email general
- [ ] **Redes sociales:** Instagram, Facebook, YouTube, WhatsApp
- [ ] **Noticias:** título de sección, subtítulo
- [ ] Subir logo del colegio (reemplaza `/media/Logo/cropped-cropped-logo.png`)
- [ ] Invalidar cache ISR al guardar: `revalidatePath("/")`

### Niveles educativos — UI especial

Las claves `niveles.info` y `niveles.extras` son arrays JSON almacenados en `ConfigSitio`.
Requieren una UI especial (no un simple `textarea`):

```
niveles.info   → array de { titulo, sede, cursos[], descripcion }
niveles.extras → array de { texto }  (bullets: JEC, PIE, talleres, etc.)
```

UI del admin para `niveles.info`:
- Lista de tarjetas, una por nivel (Parvularia, Básica, Media)
- Cada tarjeta: campos inline para título, sede, cursos (separados por coma), descripción
- Botones "Agregar nivel" y "Eliminar nivel"

UI del admin para `niveles.extras`:
- Lista de items de texto con drag & drop y botón eliminar

### Recursos externos — tabla propia

Los recursos en `src/data/recursos.ts` deben migrar a una tabla `RecursoExterno` en BD.
Esta tabla se gestiona desde `/admin/institucional` (subsección "Recursos") o desde
una ruta propia `/admin/recursos`.

```prisma
model RecursoExterno {
  id          String  @id @default(cuid())
  nombre      String
  descripcion String
  url         String
  tipo        String  // "externo" | "documento" | "temporal"
  grupo       String  // "interno" | "externo"
  nuevaPestana Boolean @default(false)
  expiraEl    String? // ISO date string — solo tipo "temporal"
  orden       Int     @default(0)
  visible     Boolean @default(true)
  icono       String? // slug del ícono SVG (para asignación en código)
}
```

UI del admin:
- Lista de recursos con drag & drop para reordenar
- Formulario por item: nombre, descripción, URL, tipo, grupo, nueva pestaña, fecha expiración
- Toggle visible/oculto
- Botones agregar y eliminar

---

## Documentos `/admin/documentos`

> Ver [DOCUMENTOS.md](./DOCUMENTOS.md) para el blueprint completo con esquema de BD,
> pantallas del admin, upload de PDFs y migración desde el hardcodeo actual.

### Gestión de documentos
- [ ] Listado agrupado por categoría: título, tags, visible, acciones
- [ ] Crear documento: título, descripción, categoría, tags, PDF upload, visible
- [ ] Editar documento: mismos campos + opción de reemplazar PDF
- [ ] Toggle visible/oculto desde el listado
- [ ] Eliminar con confirmación (borra archivo del servidor + registro en BD)
- [ ] Reordenar dentro de categoría (drag & drop o flechas)

### Gestión de categorías
- [ ] Crear categoría
- [ ] Renombrar categoría (edición inline)
- [ ] Reordenar categorías (afecta el sidebar del viewer público)
- [ ] Eliminar categoría (solo si está vacía)

### Gestión de tags
- [ ] Crear tag desde el formulario de documento
- [ ] Asignar múltiples tags por documento
- [ ] Eliminar tag global (solo si no tiene documentos asociados)

### Upload de PDFs
- [ ] API route `POST /api/admin/documentos/upload` — requiere auth
- [ ] MIME aceptado: `application/pdf` únicamente
- [ ] Tamaño máximo: 50 MB
- [ ] Guardar en `public/documentos/{uuid}.pdf`
- [ ] `revalidatePath("/documentos")` al guardar

### Migración desde hardcodeo
- [ ] Crear migration: `add_documentos_table`
- [ ] Seed con los ~20 documentos actuales de `src/app/documentos/page.tsx`
- [ ] Modificar la página pública para leer desde BD

---

## Mensajes de Contacto `/admin/mensajes`

- [ ] Listado: nombre, email, asunto, fecha, leído/no leído
- [ ] Ver detalle del mensaje
- [ ] Marcar como leído / no leído
- [ ] Eliminar con confirmación

---

## Subida de archivos (infraestructura transversal)

> **Referencia real:** los formatos de abajo NO son teóricos. Al cargar el
> carrusel de Admisión se recibió, de una tanda de 10 fotos: un `.DNG` (RAW de
> 20 MB), dos `.HEIC` (iPhone, 6–14 MB) y JPGs de hasta 7,5 MB. Ese es el input
> típico de un apoderado o del colegio subiendo desde el celular. El pipeline
> debe **aceptar y normalizar** eso, no rechazarlo. Todas esas fotos se
> convirtieron a webp de 50–190 KB con el pipeline que se describe acá.

- [ ] API route `POST /api/admin/upload` — requiere auth, acepta `multipart/form-data`
- [ ] **Aceptar formatos reales de celular/cámara**, no solo jpg/png/webp:
  - `image/jpeg`, `image/png`, `image/webp`
  - `image/heic`, `image/heif` — **default de iPhone**
  - RAW: `.dng` (y `.cr2`/`.nef`/`.arw` si aparecen) — validar por **extensión
    además de MIME**: HEIC/RAW a veces llegan como `application/octet-stream`.
- [ ] Validar tamaño: máx **30 MB** antes de procesar (un HEIC/RAW de celular
      pasa fácil los 5–20 MB; se comprime en el server, así que el límite alto
      es solo un tope de abuso, no la calidad final).
- [ ] Pipeline de normalización → siempre termina en webp:
  1. **HEIC/HEIF:** Sharp en este entorno **no decodifica HEIC** (libheif viene
     solo para AVIF: `Error: No decoding plugin installed for HEIC`). Puente con
     `heif-convert input.heic /tmp/x.png` → luego Sharp. (Alternativa: buildear
     Sharp con libheif completo; validar en ARM64 antes de depender de eso.)
  2. **DNG/RAW:** Sharp lo decodificó bien acá; si algún RAW falla, fallback a
     ImageMagick (`magick in.dng out.png`).
  3. **Resto (jpg/png/webp):** Sharp directo.
  4. **Siempre `.rotate()`** — auto-orientación por EXIF. Sin esto, las fotos de
     celular salen giradas (traen la rotación en metadatos, no en los píxeles).
  5. `.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })`
     `.webp({ quality: 72 })` → imagen full.
  6. Thumbnail: mismo pipeline con `width: 400` → `{uuid}_thumb.webp`.
- [ ] Guardar en `public/uploads/{año}/{mes}/{uuid}.webp` (+ `_thumb`).
- [ ] **Descartar el original** tras convertir — nunca dejar el DNG/HEIC de
      20 MB en disco ni en el repo.
- [ ] Devolver `{ url, thumbnailUrl, ancho, alto }` con dimensiones reales.
- [ ] En prod: destino en un Object Storage externo (S3-compatible, Vercel Blob,
      Cloudflare R2) con la misma interfaz de respuesta.

> **Bloqueante en Vercel:** `public/` es **read-only** en runtime — no se puede
> escribir el archivo subido ahí. Cualquier uploader necesita sí o sí un storage
> externo antes de la primera línea de código.
>
> **Dependencias de sistema:** el pipeline necesita `libheif`/`heif-convert` para
> HEIC y, si se cae algún RAW, `imagemagick`. **Ninguno está disponible en el
> runtime de Vercel.** Las opciones son procesar en el cliente antes de subir,
> usar un servicio de transformación, o mover el uploader fuera de Vercel.
> Confirmar esto antes de prometer soporte HEIC.

### UX del uploader de fotos
- [ ] Drag & drop + click para seleccionar
- [ ] Preview antes de confirmar
- [ ] Mostrar dimensiones y ratio del resultado tras procesar
- [ ] Advertencia (no error) si proporción es extrema (ratio < 0.4 o > 3.0)
- [ ] Multiple upload para galerías de eventos
- [ ] Mensaje claro si un formato no se pudo decodificar (ej. RAW exótico), en vez
      de fallar en silencio

### Videos
- [ ] Al subir `.mp4`/`.mov`/`.webm`, auto-generar thumbnail con ffmpeg (`-ss` a
      ~un tercio del clip, no siempre el segundo 1 — suele ser cuadro negro).
- [ ] Comprimir con ffmpeg (probado en el hero, 256 MB → 2,7 MB): quitar audio
      (`-an`), bajar a `-r 24`, `scale=1280:-2`, webp/VP9 `crf 46` o h264 `crf 32`
      `preset slow` `-movflags +faststart`.
- [ ] Validar tipos aceptados: `.mp4`, `.webm`, `.mov`
- [ ] Tamaño máximo antes de comprimir: 300 MB (un export 4K sin comprimir los
      supera fácil — el del hero llegó a 256 MB).

---

## Editor WYSIWYG

**Recomendado:** `@tiptap/react` + extensiones básicas.
- Bold, italic, lists, links, headings (H2, H3)
- **NO** incluir imágenes inline — las imágenes van en la galería, no en el texto
- Sanitizar HTML con `isomorphic-dompurify` antes de guardar en BD

**Alternativa más simple si Tiptap parece excesivo:** `react-quill-new` (fork de Quill con React 18).

---

## Seguridad

- [ ] Todas las API routes del panel verifican sesión con `getServerSession`
- [ ] Rate limiting en `POST /api/contacto` (5 req/hora por IP)
- [ ] CORS: solo aceptar origen del dominio del colegio en API routes públicas
- [ ] Headers de seguridad en `next.config.js`: CSP, X-Frame-Options, HSTS
- [ ] Logs de acciones admin: quién publicó qué y cuándo (tabla `AuditLog` en BD)

---

## Notas de implementación

- Stack actual: Next.js 16 App Router, TypeScript, TailwindCSS. **Sin base de
  datos, sin ORM y sin librería de autenticación** — Prisma y NextAuth se
  desinstalaron. Implementar el panel implica volver a elegirlos e instalarlos.
- NO usar component libraries (MUI, Chakra) — componentes propios con Tailwind
- NO usar `moment.js` — `date-fns` ya instalado
- `sharp` está instalado, pero hoy sólo corre **en el build** (lee dimensiones de
  imagen). Usarlo en runtime es otra historia — ver la nota de subida de archivos.
- Deploy: Vercel. El sitio público es 100% estático; cualquier ruta dinámica
  nueva no puede leer `public/` con `fs`. Ver `../DEPLOY_VERCEL.md`.
- `uuid` para nombres de archivo: `npm install uuid && npm install -D @types/uuid`
- La función `processImageUpload` va en `src/lib/storage.ts` (crear — **aún no existe**).
  El pipeline de referencia (rotate → resize 1600 → webp 72, + thumbnail 400, con
  puente `heif-convert` para HEIC) es el mismo que ya se aplicó a mano a las fotos
  de `public/media/Admision/` y del hero; reutilizarlo, no reinventarlo.
