# Arquitectura de Galerías

> Los componentes de galería son reutilizables en cualquier contexto: eventos, quiénes somos,
> convivencia, o donde se necesite mostrar fotos. Se llaman con props — no tienen fetch interno.
> Para el uso específico en eventos, ver [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md).

---

## Los tres componentes

### GaleriaPolaroid
**Uso:** conjunto pequeño de fotos en estilo moodboard/corkboard.
**Props:** `fotos: FotoPolaroid[]`, `lightboxMode`, `desorden`
**Ruta:** `src/components/public/shared/GaleriaPolaroid.tsx`

### GaleriaColumnas
**Uso:** galería grande con muchas fotos y/o videos, layout masonry.
**Props:** `fotos: FotoColumnas[]`, `spacing`, `columns`, `showThumbnails`
**Ruta:** `src/components/public/shared/GaleriaColumnas.tsx`

### MicroGaleria
**Uso:** tira compacta de miniaturas que enlaza a una galería mayor. Pensada
para dar profundidad a una sección con poco contenido, no para mirar fotos.
**Props:** `fotos: {src, caption?}[]`, `href`, `cantidad?` (default 6), `aleatorio?`, `cta?` (default "Ver reportaje"), `alt?`
**Ruta:** `src/components/public/shared/MicroGaleria.tsx`

**Diferencia clave:** es Server Component puro, **cero JS al cliente**. No abre
lightbox — cada miniatura es un link. Por eso no se reemplaza por las otras dos:
GaleriaColumnas arrastraría react-photo-album + lightbox para 6 miniaturas cuyo
único trabajo es invitar a entrar, y GaleriaPolaroid tiene una estética marcada
que ya se usa en Quiénes Somos.

**Dónde se usa hoy:** sección Historias, cuando hay una sola historia publicada
(`EventosWrapper` → `soloHero`). Muestra la galería del año del evento destacado.
Al publicarse una segunda historia vuelve el grid de tarjetas y la tira
desaparece sola — no hay que revertir nada.

**Selección de las miniaturas:** con `aleatorio` se sortean del total; sin la
prop, son las primeras `cantidad` en orden alfabético.

La aleatoriedad corre en el servidor y la home es estática (se arma en el build),
así que la selección se congela en el HTML generado y rota en cada deploy — no en
cada visita. Es el máximo de azar posible sin renunciar al cache. Que sea Server
Component es lo que evita un mismatch de hidratación.

**Fotos vs. posters de video:** alimentar siempre con `getMediaPhotos()`, no con
`getMediaImages()`. La carpeta del año mezcla las fotos con los thumbnails de
los videos (misma base: `Sombrero.mp4` + `Sombrero.webp`), y un poster suelto en
una tira de fotos se ve como un fotograma congelado sin contexto.

---

## Estructura de carpetas para medios

```
public/media/

  eventos/[slug-evento]/
    ├── polaroid/              ← fotos para GaleriaPolaroid del evento
    └── [año]/                 ← galería GaleriaColumnas de la edición anual
        ├── hero/              ← imagen de fondo del header (se usa la primera)
        ├── foto-*.jpg         ← fotos del año
        ├── video-*.mp4        ← videos del año
        └── video-*.jpg        ← thumbnail del video (mismo nombre)

  [Seccion]/                   ← medios de secciones de la homepage
    └── polaroid/              ← fotos para GaleriaPolaroid de esa sección

  Galeria/                     ← fotos del álbum general del colegio
  Hero/                        ← video y imagen del hero principal
  QuienesSomos/
  Niveles/
  Admision/
  carousel-cards/[instancia]/  ← fotos para CarouselLinkCard (exactamente 3)
```

---

## GaleriaPolaroid — referencia completa

```ts
export interface FotoPolaroid {
  src: string;     // URL pública de la imagen
  caption: string; // Texto bajo la foto en el marco polaroid
}

interface GaleriaPolaroidProps {
  fotos: FotoPolaroid[];
  lightboxMode?: "fullscreen" | "inline"; // default: "fullscreen"
  desorden?: number;                       // 0–1, default: 0.8
}
```

**`lightboxMode`:**
- `"fullscreen"` — click abre overlay negro a pantalla completa (página de quiénes somos).
- `"inline"` — la foto sube y se centra dentro del contenedor sin overlay (páginas de eventos).

**`desorden`:**
- `0` → grilla ordenada, sin rotación.
- `0.8` → el default: fotos dispersas con rotación aleatoria.
- `1` → máximo caos.
- En el admin, exponer como slider 0–100 que se normaliza a 0–1.

---

## GaleriaColumnas — referencia completa

```ts
export interface FotoColumnas {
  src: string;              // URL de la imagen o video
  width: number;            // px reales de la imagen procesada — OBLIGATORIO
  height: number;           // px reales de la imagen procesada — OBLIGATORIO
  alt: string;              // texto alternativo
  poster?: string;          // thumbnail del video (misma URL base, ext imagen)
  sources?: {               // múltiples fuentes de video
    src: string;
    type: string;           // "video/mp4" | "video/webm" | "video/quicktime"
  }[];
}

interface GaleriaColumnasProps {
  fotos: FotoColumnas[];
  spacing?: number;                             // default: 10
  columns?: (containerWidth: number) => number; // default: 2 cols mobile, 3 desktop
  showThumbnails?: boolean;                     // default: true
  className?: string;
}
```

**`width` y `height` son obligatorios** para el layout masonry.
Sin ellos las columnas se desalinean. Ver sección de migración más abajo.

---

## Thumbnail de videos locales

Para que un video muestre imagen previa en el grid, dejar un archivo imagen con el mismo nombre:

```
2026/
  mi-clip.mp4
  mi-clip.jpg     ← detectado automáticamente como poster
```

Extensiones buscadas en orden: `.jpg` → `.webp` → `.jpeg` → `.png`

**Generar con ffmpeg** (fotograma al segundo 1):
```bash
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 output.jpg
```

El admin debe auto-generar este thumbnail al subir un video.

---

## Migración pendiente — `Multimedia.ancho` y `Multimedia.alto`

**Estado actual:** el schema NO tiene columnas de dimensiones en `Multimedia`.

`GaleriaColumnas` necesita `width` y `height` exactos. Hoy los obtiene con Sharp
on-the-fly en cada request (solo para archivos del filesystem). Cuando las fotos vengan
de BD (admin), las dimensiones deben estar guardadas.

**Migración requerida antes de implementar subida de imágenes:**

```prisma
model Multimedia {
  // campos existentes ...
  ancho  Int?   // ancho en px de la imagen procesada (null para youtube)
  alto   Int?   // alto en px de la imagen procesada (null para youtube)
}
```

```bash
npx prisma migrate dev --name add_multimedia_dimensions
```

**Flujo:** Sharp procesa la imagen al subir → `info.width` e `info.height` → se guardan
en `Multimedia.ancho` / `Multimedia.alto` → `page.tsx` los usa directamente sin llamar
a Sharp en cada request.

---

## Pipeline de procesamiento de imágenes (al subir desde el admin)

```
imagen original (JPG/PNG/WEBP)
  ↓ rotate() — corregir orientación EXIF
  ↓ resize(1920, 1440, { fit: "inside", withoutEnlargement: true })
  ↓ webp({ quality: 82, effort: 4 })
  → imagen principal: public/uploads/{año}/{mes}/{uuid}.webp
  → dimensiones: info.width, info.height  →  Multimedia.ancho, Multimedia.alto

imagen original
  ↓ resize(400, undefined, { withoutEnlargement: true })
  ↓ webp({ quality: 75, effort: 3 })
  → thumbnail: public/uploads/{año}/{mes}/{uuid}_thumb.webp
```

La API `POST /api/admin/upload` devuelve `{ url, thumbnailUrl, ancho, alto }`.

---

## Proporciones recomendadas para GaleriaColumnas

El masonry funciona bien con proporciones entre **1:2.5 (retrato)** y **3:1 (panorama)**.
El admin debe advertir (sin bloquear) si una imagen está fuera de ese rango:

```
ratio < 0.4 → "Esta imagen es muy alta — puede desbalancear la galería."
ratio > 3.0 → "Esta imagen es muy ancha — puede ocupar poco alto en la galería."
```

---

## Fuentes de fotos — prioridades

### GaleriaPolaroid en eventos
1. `Multimedia` con `tipo === "foto"` de la edición (BD) — las de BD excluyen duplicados del filesystem
2. Archivos en `public/media/eventos/[slug]/polaroid/`
3. Si no hay ninguna de las anteriores: primeras 4 fotos de la galería del año

### GaleriaColumnas en eventos
1. Videos: primero, con thumbnail/poster si existe archivo imagen con mismo nombre
2. Fotos: `public/media/eventos/[slug]/[año]/` (excluyendo los posters de video)
3. Fotos de BD: `Multimedia` con `tipo === "foto"` — deduplicadas contra el filesystem

---

## CarouselLinkCard (componente de carousel de fotos)

Distinto a las galerías. Sirve para mostrar un set de 3 fotos con efecto fade en un card.
Se usa en la sección Convivencia.

Cada instancia necesita su propia carpeta en `public/media/carousel-cards/[nombre]/`
con exactamente 3 archivos: `foto-1.webp`, `foto-2.webp`, `foto-3.webp`.
Ver `public/media/carousel-cards/IMAGENES_SPEC.md` para especificaciones de tamaño y formato.
