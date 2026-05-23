# Blueprint: Subpáginas de Eventos

> **Referencia canónica para todos los eventos recurrentes del colegio.**
> Cada evento nuevo (Semana Adventista, Día de la Familia, Olimpiadas, etc.) sigue este blueprint.
> Modelo base: Semana Fomento Lector.

---

## 1. Concepto central: el Evento es permanente, la Galería es anual

```
┌─────────────────────────────────────────────────────┐
│  EVENTO (permanente — vive años o para siempre)     │
│                                                     │
│  · Texto narrativo (contenido WYSIWYG)              │
│  · Extracto (blockquote destacado)                  │
│  · Imagen/video de portada del hero                 │
│  · GaleriaPolaroid — fotos del filesystem           │
│    (cambia solo si se reemplazan archivos en disco) │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
    ┌─────▼──────┐         ┌──────▼──────┐
    │ Galería    │         │ Galería     │  ← solo fotos/videos
    │ Año 2026   │         │ Año 2025    │    sin texto propio
    │ (activa)   │         │ (historial) │
    └────────────┘         └─────────────┘
```

**Lo que NUNCA cambia año a año:** el texto del evento, el extracto, la portada, el polaroid.
**Lo que SÍ cambia cada año:** las fotos y videos de la galería masonry.

---

## 2. Lo que el admin edita — y lo que no

### Del Evento (se edita raramente, probablemente una vez)

| Campo | Tipo | Dónde aparece |
|-------|------|---------------|
| `nombre` | Texto | Badge del hero, navegación |
| `extracto` | Texto largo | Blockquote bajo el hero |
| `contenido` | HTML (WYSIWYG) | Cuerpo de texto del evento |
| `imagenPortada` | URL | Hero (si no hay video permanente) |
| `estado` | PUBLICADO / BORRADOR | Visibilidad del evento completo |

### De la Galería Anual (se crea una vez por año)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `año` | Entero | `2026`, `2027`… Solo el año, nada más |
| `activa` | Boolean | La galería que se muestra en la página del evento |
| `estado` | PUBLICADA / BORRADOR | Visibilidad de esa galería |
| `multimedia[]` | Fotos + Videos | El contenido de la galería masonry |

### Lo que el admin NO gestiona

| Elemento | Cómo se gestiona |
|----------|-----------------|
| GaleriaPolaroid | Reemplazando archivos en `public/media/eventos/[slug]/polaroid/` (acción del desarrollador) |
| Video/imagen permanente del hero | Idem — filesystem de la carpeta del evento |
| Historial de galerías anteriores | **Pendiente de decidir** (ver sección 7) |

---

## 3. Estructura de la subpágina pública

```
/eventos/[slug-evento]
```

Un solo slug por evento — no hay slug por año.

```
┌─────────────────────────────────────────────┐
│  NAVBAR (solid, siempre blanco)             │
├─────────────────────────────────────────────┤
│  HERO                                       │
│  · Video permanente del evento              │
│  · O imagen portada del evento              │
│  · Badge "Nombre del Evento"                │
│  · h1: Evento.nombre                        │
├─────────────────────────────────────────────┤
│  EXTRACTO (blockquote con borde izquierdo)  │
│  · Evento.extracto — texto destacado        │
├─────────────────────────────────────────────┤
│  CONTENIDO WYSIWYG + GALERÍA POLAROID       │
│  · 2 columnas: texto | polaroid sticky      │
│  · Texto: Evento.contenido (HTML)           │
│  · Polaroid: fotos de polaroid/ (filesystem)│
├─────────────────────────────────────────────┤
│  GALERÍA ANUAL (GaleriaColumnas masonry)    │
│  · Año activo — fotos y videos del año      │
│  · Heading: "Galería [año]" (configurable)  │
├─────────────────────────────────────────────┤
│  HISTORIAL (TBD — ver sección 7)            │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

---

## 4. Galerías como componentes llamables

Ambos componentes son independientes. Se llaman pasando props — sin fetch interno.

### GaleriaPolaroid (fotos permanentes del evento)

```
import GaleriaPolaroid, { type FotoPolaroid }
  from "@/components/public/shared/GaleriaPolaroid"

<GaleriaPolaroid
  fotos={[
    { src: "/media/eventos/fomento-lector/polaroid/foto-1.jpg", caption: "..." },
    { src: "/media/eventos/fomento-lector/polaroid/foto-2.jpg", caption: "" },
  ]}
  lightboxMode="inline"
  desorden={0.5}
/>
```

**Fuente de fotos:** siempre del filesystem `public/media/eventos/[slug]/polaroid/`.
Para cambiar el polaroid: reemplazar los archivos en esa carpeta y hacer deploy.
El admin NO sube fotos al polaroid — es una decisión editorial del desarrollador.

**Props:**
- `lightboxMode: "fullscreen" | "inline"` — inline para eventos (sin overlay oscuro)
- `desorden: 0–1` — nivel de rotación/dispersión (default 0.8)

---

### GaleriaColumnas (galería anual, cambia cada año)

```
import GaleriaColumnas, { type FotoColumnas }
  from "@/components/public/shared/GaleriaColumnas"

<GaleriaColumnas
  fotos={[
    { src: "/media/...", width: 1920, height: 1080, alt: "..." },
    { src: "/media/...", width: 1080, height: 1440, alt: "...",
      poster: "/media/.../thumb.jpg",
      sources: [{ src: "/media/.../video.mp4", type: "video/mp4" }]
    },
  ]}
  spacing={10}
  showThumbnails={true}
/>
```

**Fuente de fotos:** `Multimedia` vinculado a la `GaleriaAnual` activa de ese evento.
El admin sube las fotos/videos desde el panel.

**`width` y `height` son obligatorios** — dimensiones reales de la imagen procesada.
Vienen del pipeline de Sharp al subir (ver [GALERIAS.md](./GALERIAS.md)).

---

## 5. Modelo de datos objetivo

> ⚠️ El schema actual (`Edicion`) no coincide con este modelo.
> El schema tiene `Edicion` con título, contenido, extracto por año — que es el modelo anterior.
> Este blueprint define el modelo objetivo al que migrar cuando se construya el admin.

```
Evento
  id, nombre, slug
  extracto          ← texto del blockquote (permanente)
  contenido         ← HTML del cuerpo (permanente, WYSIWYG)
  imagenPortada     ← URL hero (permanente)
  activo, estado
  
  galerias: GaleriaAnual[]

GaleriaAnual
  id, año (Int)     ← solo el año: 2026, 2027...
  eventoId
  activa (Boolean)  ← la que se muestra en la página del evento
  estado            ← BORRADOR | PUBLICADA
  
  multimedia: Multimedia[]

Multimedia
  id, tipo, url, thumbnail, titulo, orden
  ancho (Int?)      ← px reales tras Sharp — requerido para GaleriaColumnas
  alto (Int?)       ← px reales tras Sharp — requerido para GaleriaColumnas
  galeriaAnualId
```

**Estado actual del schema:** el modelo `Edicion` existe con campos de texto por año.
El texto del evento vive en `Evento.descripcion` (campo simple) o en `Edicion.contenido`.
Antes de construir el admin, hay que decidir y hacer la migración del schema.

---

## 6. Estructura de carpetas para medios

```
public/media/eventos/[slug-evento]/
  ├── hero/                    ← video o imagen del header (permanente del evento)
  │   └── portada.webm         ← si existe video, tiene prioridad sobre imagen (imagen tiene prioridad para version mobil)
  └── polaroid/                ← fotos del GaleriaPolaroid (permanentes del evento)
      ├── foto-1.jpg
      └── foto-2.jpg
```

Las fotos y videos de la galería anual van en BD (`Multimedia` → `GaleriaAnual`),
subidas por el admin. No tienen carpeta en el filesystem.

> **Convención anterior (migrar):** Las fotos anuales estaban en `public/media/eventos/[slug]/[año]/`.
> Esa carpeta se mantiene por retrocompatibilidad con Fomento Lector 2026, pero el modelo
> objetivo es que las fotos anuales vivan en BD y no en el filesystem.

---

## 7. Historial de galerías — pendiente de decidir

Cuando llega un año nuevo, la galería activa se reemplaza. ¿Qué pasa con la anterior?

**Opciones en discusión:**

| Opción | Descripción | Ventaja | Pendiente |
|--------|-------------|---------|-----------|
| **A. Listado de años** | La página muestra pills de años anteriores (`2025`, `2026`, `2027`) | Simple, todo en la misma página | ¿Dónde se renderizan las galerías pasadas? |
| **B. Descargable** | PDF o ZIP con las fotos del año | Sin complejidad de routing | Generar el archivo, almacenamiento |
| **C. Página de historial** | `/eventos/[slug]/historial` con todas las galerías | Completo | Más desarrollo |
| **D. Solo conservar en BD** | Las galerías pasadas quedan en BD pero sin URL pública | Simple | Sin acceso público al historial |

**Decisión pendiente.** Por ahora, al subir una nueva galería anual:
- Marcar la nueva como `activa: true`
- La anterior queda en BD con `activa: false` (conservada, sin exposición pública aún)

---

## 8. Flujo del admin para una nueva galería anual

1. Ir a `/admin/eventos/[slug]`
2. Crear nueva galería → ingresar **solo el año** (ej: `2027`)
3. Subir fotos y videos → se guardan como `Multimedia` en esa galería
4. Previsualizar
5. Publicar → la galería queda como `activa: true`, la anterior pasa a `activa: false`

El texto del evento, el extracto y la portada **no se tocan** en este flujo.

---

## 9. Flujo del admin para editar el texto del evento

Este flujo se hace raramente (al crear el evento por primera vez, o si hay actualización editorial):

1. Ir a `/admin/eventos/[slug]/editar`
2. Editar en el WYSIWYG → `Evento.contenido`
3. Editar extracto → `Evento.extracto`
4. Cambiar imagen portada si aplica → `Evento.imagenPortada`
5. Guardar → invalida cache ISR

---

## 10. Eventos actuales y su estado

| Evento | Slug | Estado actual |
|--------|------|---------------|
| Semana Fomento Lector | `fomento-lector` | Publicado. Schema usa modelo antiguo (`Edicion` 2026). Requiere migración. |

Los demás eventos del colegio (Semana Adventista, Día de la Familia, etc.) se crean
desde cero siguiendo este blueprint — no tienen datos históricos que migrar.

---

## 11. Mapa de zonas UI pública → campos del admin

> Referencia directa para implementar el admin de eventos.
> Cada zona de la página pública está mapeada a su campo de origen, la frecuencia de cambio
> y el control de admin que se necesita.

### URL pública

```
/eventos/[slug-del-evento]          ← slug del Evento, permanente, nunca cambia por año
/eventos/fomento-lector             ← ejemplo real
```

El slug es del **Evento**, no de la galería anual. La misma URL muestra siempre
el texto permanente del evento + la galería del año activo.

---

### Zona 1 — HERO (pantalla completa, texto al fondo)

```
┌─────────────────────────────────────────────────────────────┐
│  [video/imagen de fondo — full-width]                       │
│  ░░░░ tint verde institucional + gradiente inferior ░░░░░░  │
│                                                             │
│  ← Volver a Eventos                                         │
│                                                             │
│  [badge]  Semana Fomento Lector                             │
│  Semana Fomento Lector          ← h1 (fuente display, bold) │
│  Abril · Garden College · La Unión   ← subtítulo           │
└─────────────────────────────────────────────────────────────┘
```

| Sub-zona | Campo origen | Frecuencia de cambio | Admin UI necesario |
|----------|-------------|---------------------|-------------------|
| Fondo: video | Filesystem `public/media/eventos/[slug]/hero/*.webm` | Nunca o muy raro | Acción del dev — no admin |
| Fondo: imagen | `Evento.imagenPortada` | Muy raro (una vez) | Upload único en "Editar Evento" |
| Badge + H1 | `Evento.nombre` | Nunca | Campo de texto en "Crear Evento" (no editable después salvo caso excepcional) |
| Subtítulo: mes | Calculado de `GaleriaAnual.año` (año activo) | Cambia solo cuando se activa nueva galería | Automático |
| Subtítulo: institución | `ConfigSitio["institucional.nombre"]` | Nunca | Admin Institucional |
| Subtítulo: ciudad | `ConfigSitio["institucional.ciudad"]` | Nunca | Admin Institucional |

---

### Zona 2 — EXTRACTO (blockquote con borde izquierdo dorado)

```
│  ┃ "De Peter Pan a Alicia... [texto del extracto]"    │
```

| Campo | `Evento.extracto` |
|-------|------------------|
| Tipo | Texto largo (sin HTML) |
| Frecuencia | Raramente (una vez al crear el evento) |
| Admin UI | `<textarea>` en la pantalla "Editar Evento" |

---

### Zona 3 — CONTENIDO + POLAROID (2 columnas en desktop)

```
┌─────────────────────┬──────────────────────────────┐
│ Párrafos del cuerpo │  [GaleriaPolaroid — sticky]  │
│ (texto narrativo)   │  fotos rotadas, lightbox     │
│                     │                              │
└─────────────────────┴──────────────────────────────┘
```

| Sub-zona | Campo origen | Admin UI necesario |
|----------|-------------|-------------------|
| Texto (izquierda) | `Evento.contenido` (HTML) | Editor WYSIWYG (Tiptap) en "Editar Evento" |
| Polaroid (derecha) | Filesystem `public/media/eventos/[slug]/polaroid/` | **No hay admin UI** — el dev reemplaza los archivos |

> El polaroid es intencional: las fotos se curan manualmente, no se sincronizan con la galería anual.
> Tipicamente son 4–8 fotos elegidas que representan el espíritu del evento a lo largo del tiempo.

---

### Zona 4 — GALERÍA ANUAL (GaleriaColumnas masonry)

```
┌─────────────────────────────────────────────────────┐
│  Semana Fomento Lector          ← label del evento  │
│  Galería 2026                   ← heading + año     │
│                                                     │
│  [foto] [foto] [video] [foto]   ← masonry, lightbox │
│  [foto] [video] [foto] [foto]                       │
└─────────────────────────────────────────────────────┘
```

| Elemento | Origen | Admin UI necesario |
|----------|--------|-------------------|
| Label (nombre evento) | `Evento.nombre` | Automático |
| Año en heading | `GaleriaAnual.año` (la activa) | Automático al crear galería |
| Fotos | `Multimedia[]` de `GaleriaAnual` activa | Upload múltiple en gestión de galería anual |
| Videos | `Multimedia[]` tipo video de `GaleriaAnual` | Upload de video (MP4/WebM) en gestión de galería |
| YouTube | `Multimedia[]` tipo youtube | Campo URL en gestión de galería |

**Nota sobre dimensiones:** cada `Multimedia` debe tener `ancho` y `alto` guardados
al subir (pipeline Sharp) — `GaleriaColumnas` los necesita para el layout masonry.
Ver [GALERIAS.md](./GALERIAS.md).

---

### Zona 5 — OTRAS EDICIONES (pills de años)

```
│  Ediciones anteriores — Semana Fomento Lector        │
│  [2025]  [2024]                                      │
```

| Elemento | Origen | Admin UI necesario |
|----------|--------|-------------------|
| Pills de años | `GaleriaAnual[]` publicadas, todas las que no son la activa | Ninguno — se generan automáticamente al publicar galerías |
| Link de cada pill | `/eventos/[slug]?año=2025` o similar (TBD) | Ninguno |

> La visibilidad del historial de galerías está pendiente de decidir (ver sección 7).
> Por ahora se muestran como pills que enlazan a la misma URL (comportamiento a definir).

---

### Flujo completo del admin para un evento

```
/admin/eventos
  └── [Listado de eventos: Fomento Lector, Semana Adventista…]
      └── Fomento Lector
          ├── [Editar evento]          → Evento.nombre, extracto, contenido (WYSIWYG), imagenPortada
          └── [Galerías]
              ├── 2026 (activa) ──────→ /admin/eventos/fomento-lector/galeria/2026
              │     └── Subir fotos, videos, links YouTube, reordenar, publicar
              └── [+ Nueva galería]    → crear GaleriaAnual con solo el año
```

**Regla clave:** el admin de eventos tiene **dos pantallas distintas con propósitos distintos:**

1. **Editar Evento** — texto, extracto, portada. Se visita raramente (al crear + ediciones editoriales).
2. **Gestionar Galería Anual** — fotos y videos del año. Se visita cada año al actualizar el evento.

Nunca mezclar estas dos pantallas en la misma vista — tienen frecuencias de uso muy distintas.
