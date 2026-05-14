# Panel Admin — Garden College · TODO

> Estado: sin implementar. La web pública ya está funcionando con datos desde BD.
> El panel es el paso siguiente para que el colegio gestione el contenido sin tocar código.

---

## Documentación relacionada (leer antes de empezar)

| Archivo | Para qué sirve |
|---------|----------------|
| `docs/GALERIA_EVENTOS.md` | Arquitectura completa de galerías: GaleriaColumnas, GaleriaPolaroid, estructura de carpetas, convención de thumbnails de video. **Leer antes de implementar subida de multimedia.** |
| `docs/GUIA_CONTENIDO_CONVIVENCIA.md` | Guía editorial para la sección Convivencia — útil al implementar el editor de config institucional |
| `prisma/schema.prisma` | Modelo de datos actual. Ver sección "Migración requerida" más abajo antes de tocar Multimedia |
| `src/components/public/shared/GaleriaColumnas.tsx` | Componente de galería masonry — define qué campos necesita cada foto (`src`, `width`, `height`, `alt`, `poster?`) |
| `src/app/eventos/[slug]/page.tsx` | Cómo se construyen los datos de galería hoy (filesystem + BD). El admin reemplaza la parte de filesystem |

---

## Migración requerida — antes de implementar subida de imágenes

El modelo `Multimedia` necesita dos campos nuevos para que la galería masonry funcione correctamente con imágenes subidas por el admin:

```prisma
model Multimedia {
  // campos existentes...
  ancho  Int?  // ancho en px de la imagen procesada (null para youtube)
  alto   Int?  // alto en px de la imagen procesada (null para youtube)
}
```

**Por qué son necesarios:**
`GaleriaColumnas` (el componente masonry) recibe `width` y `height` por cada foto para calcular proporciones en el layout. Hoy, para imágenes del filesystem, esas dimensiones se leen con Sharp en cada request — es costoso. Cuando el admin suba una imagen y procese con Sharp, las dimensiones ya se conocen: guardarlas en BD elimina ese costo en producción.

**Ver también:** `docs/GALERIA_EVENTOS.md` → sección "Por qué Multimedia no tiene width y height" (actualizada).

```bash
npx prisma migrate dev --name add_multimedia_dimensions
```

---

## Autenticación

- [ ] Configurar NextAuth con Google OAuth 2.0
  - Variables requeridas: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - Restringir login a emails autorizados (lista en `.env` o tabla `AdminUser` en BD)
- [ ] Middleware que protege `/admin/**` — redirige a `/admin/login` si no hay sesión
- [ ] Página `/admin/login` — botón "Continuar con Google"
- [ ] Página `/admin/logout`

---

## Dashboard `/admin`

- [ ] Resumen de contenido: N noticias publicadas, N eventos, N mensajes sin leer
- [ ] Accesos rápidos a cada sección
- [ ] Estado del sitio: última actualización de config, última noticia publicada

---

## Noticias `/admin/noticias`

- [ ] Listado con paginación: título, estado (BORRADOR / PUBLICADA), fecha, acciones
- [ ] Crear noticia: título, slug (auto desde título, editable), extracto, contenido (editor WYSIWYG), imagen portada, estado
- [ ] Editar noticia existente
- [ ] Eliminar noticia (con confirmación)
- [ ] Publicar / despublicar desde el listado (toggle rápido)
- [ ] Editor WYSIWYG: usar `@tiptap/react` (tiene build ARM64, sin dependencias nativas)
- [ ] Sanitizar HTML antes de guardar en BD (`isomorphic-dompurify`)
- [ ] Subir imagen portada → pasar por pipeline de procesamiento → guardar URL en BD

---

## Eventos `/admin/eventos`

- [ ] Listado de eventos (tipo recurrente): Acto de Premiación, Semana Adventista, etc.
- [ ] Crear / editar evento base (nombre, slug, recurrencia, activo)
- [ ] **Ediciones por evento**: cada año es una edición
  - Campos: título, slug, extracto, contenido, imagen portada, fecha, estado, destacada
  - Subir multimedia: fotos (tipo `foto`) y links de YouTube (tipo `youtube`)
  - Orden de multimedia (drag & drop o campos de orden numérico)
- [ ] Marcar edición como "destacada" (aparece como hero en la home)
- [ ] Publicar / despublicar edición
- [ ] Al subir fotos para una edición:
  - Procesar con pipeline de imágenes (ver sección más abajo)
  - Guardar `ancho` y `alto` procesados en `Multimedia.ancho` / `Multimedia.alto`
  - Estos valores son los que `GaleriaColumnas` necesita para el layout masonry

---

## Galería `/admin/galeria`

- [ ] Listado de álbumes
- [ ] Crear / editar álbum: nombre, descripción, fecha, portada, activo
- [ ] Subir fotos a un álbum (multiple upload) — procesar cada una con el pipeline de imágenes
- [ ] Reordenar fotos dentro del álbum
- [ ] Eliminar foto con confirmación
- [ ] Las fotos se sirven desde `public/uploads/` (dev) o Object Storage (prod)

---

## Configuración institucional `/admin/institucional`

Edición de las claves `ConfigSitio` agrupadas por sección:

- [ ] **Institucional**: nombre del colegio, slogan, misión, visión, reseña
- [ ] **Sellos educativos**: título y descripción de cada sello (Vida Saludable, Inglés, Cristiana)
- [ ] **Convivencia**: título, descripción, logros (editor de lista) — ver `docs/GUIA_CONTENIDO_CONVIVENCIA.md`
- [ ] **Contacto**: sedes (nombre, dirección, teléfono, niveles), email general
- [ ] **Redes sociales**: Facebook, Instagram, YouTube
- [ ] **Admisión**: texto informativo, link al SAE del Mineduc
- [ ] **Eventos**: título sección, subtítulo, badge
- [ ] **Noticias**: título sección, subtítulo, badge
- [ ] Subir logo del colegio (reemplaza `/media/Logo/cropped-cropped-logo.png`)
- [ ] Invalidar cache ISR al guardar (llamar a `revalidatePath("/")`)

---

## Mensajes de contacto `/admin/mensajes`

- [ ] Listado: nombre, email, asunto, fecha, leído/no leído
- [ ] Ver detalle del mensaje
- [ ] Marcar como leído
- [ ] Eliminar (con confirmación)
- [ ] Badge en sidebar con N mensajes no leídos

---

## Subida de archivos (infraestructura transversal)

- [ ] API route `POST /api/admin/upload` — requiere auth, acepta `multipart/form-data`
- [ ] Validar tipo MIME: `image/jpeg`, `image/png`, `image/webp` (rechazar el resto)
- [ ] Validar tamaño: máx 10 MB antes de procesar (el resultado siempre será mucho menor)
- [ ] Procesar imagen con Sharp — ver pipeline completo en la sección siguiente
- [ ] Guardar imagen procesada: `public/uploads/{año}/{mes}/{uuid}.webp`
- [ ] Guardar thumbnail: `public/uploads/{año}/{mes}/{uuid}_thumb.webp`
- [ ] Devolver `{ url, thumbnailUrl, ancho, alto }` — `ancho`/`alto` son las dimensiones tras el resize
- [ ] En prod: migrar destino a Oracle Object Storage (mantener misma interfaz de respuesta)

---

## Procesamiento de imágenes — pipeline Sharp para galería

> **Por qué importa:** `GaleriaColumnas` necesita `width` y `height` exactos por foto para construir el layout masonry correctamente. Si estos valores son incorrectos, las columnas se desalinean. Sharp procesa la imagen al subirla y devuelve las dimensiones finales — que se guardan en BD y se usan directamente en `page.tsx` sin volver a llamar a Sharp en cada request.

### Pipeline de procesamiento

```typescript
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

async function processImageUpload(inputBuffer: Buffer) {
  const id = uuid();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const dir = path.join(process.cwd(), "public", "uploads", String(year), month);
  fs.mkdirSync(dir, { recursive: true });

  // Imagen principal: resize a máx 1920×1440 manteniendo proporción, convertir a WebP
  const { data: mainData, info } = await sharp(inputBuffer)
    .rotate()                               // corregir orientación EXIF automáticamente
    .resize(1920, 1440, {
      fit: "inside",                        // mantiene proporción, no recorta nada
      withoutEnlargement: true,             // no agrandar imágenes pequeñas
    })
    .webp({ quality: 82, effort: 4 })       // effort 4: buen balance calidad/tiempo
    .toBuffer({ resolveWithObject: true });

  // info.width e info.height son las dimensiones REALES tras el resize
  // — estos son los valores que van a Multimedia.ancho y Multimedia.alto

  const filename = `${id}.webp`;
  fs.writeFileSync(path.join(dir, filename), mainData);

  // Thumbnail para listados del panel admin (no se usa en la galería pública)
  const { data: thumbData } = await sharp(inputBuffer)
    .rotate()
    .resize(400, undefined, { withoutEnlargement: true })
    .webp({ quality: 75, effort: 3 })
    .toBuffer({ resolveWithObject: true });

  const thumbFilename = `${id}_thumb.webp`;
  fs.writeFileSync(path.join(dir, thumbFilename), thumbData);

  return {
    url: `/uploads/${year}/${month}/${filename}`,
    thumbnailUrl: `/uploads/${year}/${month}/${thumbFilename}`,
    ancho: info.width,    // guardar en Multimedia.ancho
    alto: info.height,    // guardar en Multimedia.alto
  };
}
```

### Proporciones y tamaños de salida

| Tipo de imagen | Dimensión procesada | Resultado típico |
|---------------|--------------------|--------------------|
| Paisaje / horizontal | máx 1920px ancho | 1920×1080, 1920×1280, etc. |
| Retrato / vertical | máx 1440px alto | 1080×1440, 960×1440, etc. |
| Cuadrada | sin recorte | 1440×1440 máx |
| Imagen pequeña (< límites) | sin cambios | dimensiones originales |

**Tamaño de archivo esperado tras WebP quality 82:** 100–400 KB para fotos típicas de evento (vs 3–8 MB del original JPG).

### Validación de proporción — advertencia en UI

La galería masonry se ve bien con proporciones entre **1:2 (retrato)** y **3:1 (panorama)**. Imágenes fuera de ese rango no son un error, pero pueden verse extrañas:

```typescript
function checkAspectRatio(ancho: number, alto: number): string | null {
  const ratio = ancho / alto;
  if (ratio > 3) return "Esta imagen es muy ancha (ratio > 3:1) — puede ocupar poco alto en la galería.";
  if (ratio < 0.4) return "Esta imagen es muy alta (ratio < 1:2.5) — puede desbalancear la galería.";
  return null; // proporción OK
}
```

Mostrar como advertencia informativa en el formulario de subida — no bloquear la subida.

### UX del uploader de fotos

- [ ] Drag & drop + click para seleccionar archivo
- [ ] Preview de la imagen antes de confirmar
- [ ] Mostrar dimensiones y ratio del resultado (`1 920 × 1 080 · 16:9`) tras procesar
- [ ] Mostrar advertencia si proporción es extrema (ver arriba)
- [ ] Mostrar tamaño del archivo procesado en KB
- [ ] Para galería de eventos: multiple upload (varias fotos a la vez)
- [ ] Para imagen portada de noticia / evento: single upload

---

## Thumbnails de video en galería de eventos

La galería de eventos muestra videos (`.mp4`, `.webm`, `.mov`) en el layout masonry junto a las fotos. Para que el video muestre una imagen previa (en lugar de negro), se usa la convención de archivo mismo stem:

```
public/media/eventos/fomento-lector/2026/
  LocuraDeLunes.webm          ← video
  LocuraDeLunes.jpg           ← thumbnail detectado automáticamente
```

Extensiones buscadas en orden: `.jpg` → `.webp` → `.jpeg` → `.png`

**Generación manual con ffmpeg** (fotograma en el segundo 1):
```bash
ffmpeg -i input.webm -ss 00:00:01 -vframes 1 output.jpg
```

**Pendiente para el panel admin:**
- [ ] Al subir un video en `/admin/eventos`, auto-generar thumbnail con ffmpeg (disponible en Docker)
  - `ffmpeg -i <input> -ss 00:00:01 -vframes 1 <mismo_stem>.jpg`
  - Guardar junto al video con mismo stem
- [ ] Comprimir video antes de guardar (los clips de Instagram pesan 10–80 MB):
  ```bash
  ffmpeg -i clip_original.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:-2" clip_web.mp4
  ```
  Target: < 5 MB por clip
- [ ] Validar tipos de video aceptados: `.mp4`, `.webm` (`.mov` solo en dev)
- [ ] Tamaño máximo para videos antes de comprimir: 200 MB

---

## Sidebar / Layout del panel

- [ ] Layout compartido para todas las rutas `/admin/**`
- [ ] Sidebar con links: Dashboard, Noticias, Eventos, Galería, Institucional, Mensajes
- [ ] Header con nombre del usuario logueado y botón cerrar sesión
- [ ] Responsive: sidebar colapsable en móvil
- [ ] Indicador de sección activa

---

## Seguridad y hardening

- [ ] Todas las API routes del panel verifican sesión con `getServerSession`
- [ ] Rate limiting en `POST /api/contacto` (5 req/hora por IP) — usar `@upstash/ratelimit` o solución sin Redis
- [ ] CORS: solo aceptar origen del dominio del colegio en las API routes públicas
- [ ] Headers de seguridad en `next.config.js`: CSP, X-Frame-Options, HSTS
- [ ] Logs de acciones admin: quién publicó qué y cuándo (tabla `AuditLog` en BD)

---

## Notas de implementación

- Stack ya definido: Next.js 14 App Router, Prisma, PostgreSQL, TailwindCSS, NextAuth
- NO usar component libraries externas (MUI, Chakra) — componentes propios con Tailwind
- NO usar `moment.js` — `date-fns` ya está instalado
- Imágenes: `sharp` ya tiene build ARM64, no cambiar
- Deploy: Docker en Oracle Cloud ARM64 — todo debe funcionar en `linux/arm64`
- Editor WYSIWYG recomendado: `@tiptap/react` + extensiones básicas (negrita, cursiva, listas, links, imagen)
- Alternativa más simple si Tiptap parece excesivo: `react-quill-new` (fork de Quill con soporte React 18)
- `uuid` para nombres de archivos subidos: `npm install uuid && npm install -D @types/uuid`
- La función `processImageUpload` de arriba va en `src/lib/storage.ts` (el archivo ya existe en el proyecto)
