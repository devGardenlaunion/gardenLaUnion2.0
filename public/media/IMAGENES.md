# Guía de medios — Garden College Web

Referencia para preparar archivos y para construir el panel admin.

---

## Formatos aceptados

### Imágenes
| Formato | Cuándo usarlo |
|---------|---------------|
| **WebP** | Todo — fotos, íconos, imágenes con o sin fondo transparente. WebP soporta canal alfa (reemplaza PNG). Calidad recomendada: 82–85 |
| **JPG** | Solo como fallback si la herramienta de origen no exporta WebP |

> No usar PNG, AVIF ni GIF. WebP cubre todos los casos.

### Videos
| Formato | Cuándo usarlo |
|---------|---------------|
| **WebM** (VP9) | Fuente principal — mejor compresión |
| **MP4** (H.264) | Fallback obligatorio para Safari — agregar siempre como segundo `<source>` |

> El componente Hero solo tiene `<source>` WebM. Agregar MP4 si se necesita soporte Safari completo.

---

## Secciones y archivos

### Hero — `/media/Hero/`

Fondo de pantalla completa. Desktop usa video; mobile portrait usa imagen fija.

| Archivo | Tipo | Dimensiones | Notas |
|---------|------|-------------|-------|
| `heroShort.webm` | Video | 1920×1080 mínimo | Loop silencioso, sin texto quemado. **Existe** |
| `heroShort.mp4` | Video | 1920×1080 mínimo | Fallback Safari. **Falta** |
| `hero-mobile.webp` | Imagen | 800×1000 px (vertical) | Mobile portrait. Si no existe se usa placeholder |

El componente lee `heroShort.webm` hardcodeado y `imagenMobile` desde `ConfigSitio` (`hero.imagen_mobile`).

---

### Logo — `/media/Logo/`

| Archivo | Tipo | Dimensiones | Notas |
|---------|------|-------------|-------|
| `cropped-cropped-logo.png` | PNG | — | **Existe** — migrar a `.webp` con transparencia cuando se reemplace |

El componente Navbar lo lee con ruta hardcodeada. Al reemplazar, actualizar `Navbar.tsx:133`.

---

### Niveles — `/media/Niveles/`

Tarjetas de la sección Niveles Educativos. El componente muestra `aspect-[2/1]` (horizontal).

| Archivo | Tarjeta | Dimensiones | Notas |
|---------|---------|-------------|-------|
| `nivel-prebasica.webp` | Prebásica — Pre-K y Kínder | 800×400 px | Carpeta vacía — **falta** |
| `nivel-basica.webp` | Educación Básica — 1° a 6° | 800×400 px | Carpeta vacía — **falta** |
| `nivel-media.webp` | Educación Media — 7° a 4° Medio | 800×400 px | Carpeta vacía — **falta** |

> Nota: el seed apunta a `.jpg`. Cuando se suban las imágenes definitivas en WebP, actualizar el seed o el admin.

---

### Quiénes Somos — `/media/QuienesSomos/polaroid/`

Fotos para el componente GaleriaPolaroid. Se muestran en efecto polaroid interactivo (cuadradas o verticales).
El componente `QuienesSomos` las carga automáticamente — **todas las imágenes en la carpeta aparecen**.

| Propiedad | Valor |
|-----------|-------|
| Cantidad | Sin límite — todas las imágenes de la carpeta se muestran |
| Aspecto preferido | Cuadrado o levemente vertical (3:4) |
| Dimensiones | 400×400 px mínimo |
| Formato | WebP |
| Nombre | Sin espacios — usar `qs-01.webp`, `qs-02.webp`... para controlar el orden (alfabético) |

> Para agregar o reemplazar fotos: basta con poner/quitar archivos de esta carpeta.
> No se necesita tocar código. Los cambios aparecen en la próxima recarga (dev) o en ≤60 s (producción ISR).

---

### Galería — `/media/Galeria/`

Fotos del mosaico masonry. El sistema lee hasta **9 imágenes**, ordenadas alfabéticamente.

| Propiedad | Valor |
|-----------|-------|
| Cantidad máxima | 9 (el resto se ignora) |
| Aspecto | Libre — el layout masonry se adapta |
| Formato | WebP |
| Nombre | Sin espacios — prefijo numérico para controlar orden: `01-actividad.webp`, `02-evento.webp`... |

> Para agregar o reemplazar fotos: basta con poner/quitar archivos de esta carpeta.
> No se necesita tocar código. Los cambios aparecen en ≤60 s (producción ISR).

---

### Convivencia — `/media/carousel-cards/convivencia/`

Fotos para el carousel del bloque Convivencia. Exactamente 3 imágenes.

| Archivo | Dimensiones | Notas |
|---------|-------------|-------|
| `foto-1.webp` | 800×500 px | **Existe** |
| `foto-2.webp` | 800×500 px | **Existe** |
| `foto-3.webp` | 800×500 px | **Existe** |

Aspect ratio del componente: 16:10. El tercio inferior queda tapado por overlay — no poner texto quemado ahí.

---

### Admisión — `/media/Admision/`

| Archivo | Dimensiones | Uso | Notas |
|---------|-------------|-----|-------|
| `admision.webp` | 600×800 px | Foto tarjeta (aspect 3:4) | Carpeta vacía — **falta** |

---

### Contacto — `/media/Contacto/`

Actualmente sin imágenes — la sección usa mapa OpenStreetMap (Leaflet). Reservado para uso futuro.

---

### Noticias — `/media/Noticias/`

Imágenes de portada de noticias. Se gestionan desde el panel admin.

| Propiedad | Valor |
|-----------|-------|
| Aspecto | 16:9 horizontal |
| Dimensiones | 800×450 px mínimo |
| Formato | WebP |
| Estructura | `/media/Noticias/{año}/{mes}/portada-{slug}.webp` |

---

### Sellos — `/media/Sellos/`

Íconos para las 3 tarjetas de sellos educativos. Actualmente se usan SVG inline — esta carpeta está reservada para reemplazarlos.

| Archivo | Tarjeta | Dimensiones | Notas |
|---------|---------|-------------|-------|
| `sello-vida-saludable.webp` | Vida Saludable | 128×128 px | Fondo transparente (WebP alfa) |
| `sello-formacion-cristiana.webp` | Formación Cristiana | 128×128 px | Fondo transparente (WebP alfa) |
| `sello-ingles.webp` | Inglés | 128×128 px | Fondo transparente (WebP alfa) |

---

## Resumen de estado

| Sección | Estado |
|---------|--------|
| Hero video (WebM) | ✅ Existe |
| Hero video (MP4 fallback) | ❌ Falta |
| Hero imagen mobile | ❌ Falta |
| Logo | ✅ Existe (PNG — migrar a WebP) |
| Niveles (3 imágenes) | ❌ Faltan |
| Quiénes Somos | ✅ 11 fotos disponibles |
| Galería | ✅ 9 fotos disponibles |
| Convivencia carousel | ✅ 3 fotos |
| Admisión | ❌ Falta |
| Noticias | ❌ (se sube desde admin) |
| Sellos | ❌ Opcionales (hay SVG inline) |
