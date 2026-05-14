# Galerías en subpáginas de eventos

> Documento técnico de referencia. Para requisitos del panel admin (pipeline de subida, procesamiento Sharp, campos `ancho`/`alto` en Multimedia) ver `docs/ADMIN_TODO.md`.

## Decisiones de arquitectura (2026-04)

### Componente principal
**GaleriaPolaroid** — layout de dos columnas: contenido del evento a la izquierda, galería a la derecha. Igual al formato de "Quiénes Somos" en la homepage (`lightboxMode="inline"`).

Si en el futuro una edición tiene 15+ fotos y se quiere una galería masonry separada, usar **GaleriaColumnas** (debajo del contenido). Ver sección "Galería grande" más abajo.

### Fuentes de fotos (ambas activas)

| Fuente | Cómo funciona | Quién la gestiona |
|--------|--------------|-------------------|
| **Filesystem** | Archivos en `public/media/eventos/[slug]/[año]/` | Desarrollador al hacer deploy |
| **BD** (`Multimedia` tipo `"foto"`) | Registros vinculados a la Edición | Admin panel (cuando esté construido) |

Las fotos de BD tienen prioridad en la deduplicación: si una URL ya está registrada en BD, no se vuelve a mostrar desde el filesystem.

---

## Estructura de carpetas

```
public/media/eventos/[slug]/
  ├── polaroid/       ← fotos permanentes del evento para GaleriaPolaroid
  └── [año]/          ← contenido específico de la edición anual
      ├── hero/       ← imagen de fondo del header (solo se usa la primera)
      └── [archivos]  ← galería grande anual (GaleriaColumnas — activo)
```

La `polaroid/` vive al nivel del evento porque es la identidad visual del evento — no cambia cada año. La galería grande (`2026/`, `2027/`, …) es el registro fotográfico de cada edición.

Para secciones de la homepage:
```
public/media/[Seccion]/
  └── polaroid/   ← fotos para GaleriaPolaroid de esa sección
```

**Regla:** siempre usar la subcarpeta `polaroid/` para las fotos de GaleriaPolaroid. La raíz del año queda reservada para la galería grande futura.

---

## Cómo agregar fotos a un evento

### Opción A — Filesystem (disponible hoy)

1. Copiar imágenes a la subcarpeta `polaroid/` del evento:
   ```
   public/media/eventos/[slug-del-evento]/polaroid/
   ```
   Ejemplo para Fomento Lector:
   ```
   public/media/eventos/fomento-lector/polaroid/
   ```

2. Formatos aceptados: `.jpg`, `.jpeg`, `.png`, `.webp`

3. Para la imagen hero (fondo del header), usar la subcarpeta:
   ```
   public/media/eventos/fomento-lector/2026/hero/
   ```
   Solo se usa la primera imagen de esa carpeta como hero.

4. Las fotos de `polaroid/` aparecen automáticamente en la galería polaroid al recargar la página. No requiere reiniciar el servidor en producción (el render es en tiempo de request).

### Opción B — BD via admin panel (futuro)

Crear registros en `Multimedia` con:
- `tipo`: `"foto"`
- `url`: URL pública de la imagen (resultado del pipeline de subida)
- `titulo`: caption que aparecerá en la polaroid
- `orden`: orden de aparición
- `edicionId`: ID de la edición correspondiente
- `ancho`: ancho en px de la imagen procesada ← **requerido para GaleriaColumnas**
- `alto`: alto en px de la imagen procesada ← **requerido para GaleriaColumnas**

Los campos `ancho`/`alto` los entrega el pipeline de subida automáticamente — ver `docs/ADMIN_TODO.md`.

---

## `Multimedia.ancho` y `Multimedia.alto` — pendiente de migración

**Estado actual:** el schema no tiene columnas de dimensiones.

`GaleriaPolaroid` no las necesita (preserva proporción con CSS). `GaleriaColumnas` (masonry) sí las necesita — hoy las lee con Sharp on-the-fly en cada request desde el filesystem, lo cual es aceptable para archivos estáticos pero no escala cuando las fotos vienen de BD.

**Qué hacer al construir el admin:**
1. Agregar `ancho Int?` y `alto Int?` a `Multimedia` en `prisma/schema.prisma`
2. Correr `npx prisma migrate dev --name add_multimedia_dimensions`
3. En `POST /api/admin/upload`, después del resize con Sharp, guardar `info.width` e `info.height` en esos campos
4. En `src/app/eventos/[slug]/page.tsx`, usar `m.ancho` y `m.alto` directamente para las fotos de BD (sin llamar a Sharp en el request)

Ver pipeline completo de procesamiento en `docs/ADMIN_TODO.md` → sección "Procesamiento de imágenes — pipeline Sharp para galería".

---

## Galería grande (GaleriaColumnas) — implementada

Las fotos y videos del año (`public/media/eventos/[slug]/[año]/`) se muestran en un layout masonry debajo del contenido del evento.

- Videos van primero (con thumbnail/poster si existe un archivo imagen con el mismo nombre)
- Fotos a continuación, ordenadas por nombre de archivo
- Click en foto → lightbox; click en video → reproducción inline con controles
- La galería no incluye videos en la sección polaroid (filtro activo)

**Agregar thumbnail a un video:** dejar un `.jpg` (o `.webp`) con el mismo stem junto al video:
```
2026/
  mi-clip.webm
  mi-clip.jpg   ← thumbnail detectado automáticamente
```

---

## Convención de nomenclatura de archivos

Usar nombres descriptivos con guiones, sin espacios ni tildes:

```
public/media/eventos/fomento-lector/
  ├── polaroid/
  │   ├── disfraces-basica.jpg        ← permanente, identidad del evento
  │   └── premiacion.jpg
  └── 2026/
      ├── hero/
      │   └── portada-fomento-lector-2026.jpg
      ├── primer-dia-activacion-lectora.jpg
      └── maraton-literaria.jpg
```

---

## Videos locales en eventos

### Formato y ubicación

Clips cortos (cierre, actos, desfiles) van en:
```
public/media/eventos/[slug]/[año]/videos/
```
Formatos aceptados: `.mp4`, `.webm`, `.mov`

El servidor los sirve directamente como archivos estáticos. En la página del evento se renderizan con `<video autoplay muted loop playsinline>`.

### Peso — problema conocido, compresor pendiente

**Los clips de Instagram pueden pesar 10–80 MB.** Antes de copiar cualquier video a la carpeta, comprimirlo manualmente con ffmpeg:

```bash
ffmpeg -i clip_original.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1280:-2" clip_web.mp4
```

| Parámetro | Por qué |
|-----------|---------|
| `-crf 28` | Balance calidad/peso para web (range 18–51, menor = mejor calidad) |
| `scale=1280:-2` | Limitar a 720p — suficiente para clips de evento en móvil |
| `-preset slow` | Mejor compresión a igual calidad (solo importa en tiempo de proceso) |

**Target de peso:** < 5 MB por clip. Un clip de 15 s debería caber en 2–4 MB.

---

### ⚠️ TODO — Herramienta de compresión automática (pendiente)

Al momento de construir el panel de administración o el flujo de subida de archivos, implementar un **pipeline de compresión automática** para videos:

- Al subir un .mp4/.mov vía admin panel, procesarlo con Sharp (para thumbnails) + ffmpeg (para compresión H.264)
- Guardar la versión comprimida, descartar el original pesado
- Target: ≤ 5 MB por clip, resolución máxima 1280px ancho
- Misma filosofía que ya se usa para imágenes (sharp thumbnail al subir)
- Referencia: ver cómo `src/components/public/sections/Galeria.tsx` usa Sharp para imágenes

---

## Nota sobre "Prebásica"

En esta web, Pre-Kínder y Kínder siempre se agrupan y se nombran como **"Prebásica"**. No usar "Pre-Kínder y Kínder" en contenido visible (HTML de ediciones, descripciones, etc.).
