# Admin: Documentación de Galerías — Referencia de Desarrollo

> **Archivo de referencia** para el desarrollo del panel admin de galerías.  
> Cubre dos tipos de galería usados en la onepage: `DynamicPhotoGallery` (fotos físicas) y `GaleriaPolaroid` (polaroid con lightbox).

---

## Tipo A — GaleriaColumnas (galería de fotos locales)

**Componente público:** `src/components/public/GaleriaColumnas.tsx`  
**Tipo de dato:** `FotoColumnas` (exportado desde el mismo componente)  
**API auxiliar:** `src/app/api/media/galeria/route.ts` (útil para admin)  
**Fuente de imágenes:** `public/media/Galeria/` (archivos físicos en servidor)  
**Estado:** Implementado y activo en `Galeria.tsx`.

### Patrón composable (igual que GaleriaPolaroid)
El componente es "tonto": solo renderiza lo que recibe por props.  
El Server Component padre (`Galeria.tsx`) lee `public/media/Galeria/` con `fs` + `sharp` y le pasa el array.

```tsx
// En el Server Component padre:
const fotos = await getFotosGaleria(); // lee public/media/Galeria/
<GaleriaColumnas fotos={fotos} className="max-w-6xl mx-auto" />
```

### Cómo funciona
- Renderiza con `react-photo-album` (`ColumnsPhotoAlbum`, layout de columnas).
- Al clic, abre `yet-another-react-lightbox` con **backdrop blur** (no negro sólido):
  ```ts
  styles={{ container: { backgroundColor: "rgba(17,24,39,0.55)", backdropFilter: "blur(14px)" } }}
  ```
- Barra de thumbnails en la parte inferior (plugin `Thumbnails` de YARL).

### Props disponibles
```tsx
interface GaleriaColumnasProps {
  fotos: FotoColumnas[];
  spacing?: number;                    // default 10
  columns?: (w: number) => number;     // default: 2/3/4 según ancho
  showThumbnails?: boolean;            // default true
  className?: string;
}
```

### Tipo FotoColumnas
```ts
export interface FotoColumnas {
  src: string;
  width: number;
  height: number;
  alt: string;
}
```

### Para agregar fotos
Copiar imágenes (jpg, jpeg, png, webp, avif) a `public/media/Galeria/`.  
El Server Component las detecta automáticamente en el próximo render.

### Pendiente para admin
Cuando se desarrolle `/admin/galeria`, agregar:
- Pantalla de **upload** a `public/media/Galeria/` (usar sharp para optimizar a webp).
- Botón de **eliminar** foto (borra archivo físico).
- Vista previa del grid antes de publicar.
- El endpoint `/api/media/galeria` ya existe y sirve de base para el admin.
- Considerar mover a Object Storage (S3-compatible) en producción en vez de filesystem.

---

## Tipo B — GaleriaPolaroid (galería estilo polaroid)

**Componente público:** `src/components/public/GaleriaPolaroid.tsx`  
**Estado:** Pendiente — desarrollar cuando se implemente el panel admin de galería.

---

## Qué necesita este componente desde el admin

El componente `GaleriaPolaroid` actualmente recibe un prop `fotos: FotoPolaroid[]`.  
Cada ítem tiene:
```ts
interface FotoPolaroid {
  src: string;    // URL de la imagen
  caption: string; // Texto bajo la foto (estilo pluma/polaroid)
}
```

Cuando se desarrolle `/admin/galeria`, hay que agregar soporte para **Galerías Polaroid** como un tipo especial de galería, con los siguientes campos en BD y panel:

---

## Campos que necesita el modelo en Prisma

```prisma
model GaleriaPolaroid {
  id          String   @id @default(cuid())
  nombre      String   // Nombre interno de la galería (ej: "Convivencia 2024")
  descripcion String?  // Descripción corta visible en admin (no pública necesariamente)
  slug        String   @unique
  publicada   Boolean  @default(false)
  orden       Int      @default(0)  // Para ordenar galerías en la onepage
  fotos       FotoPolaroidItem[]
  creadoEn    DateTime @default(now())
  actualizadoEn DateTime @updatedAt
}

model FotoPolaroidItem {
  id         String          @id @default(cuid())
  src        String          // URL de la imagen (subida con sharp)
  caption    String          // Texto descriptivo de la foto
  orden      Int             @default(0)
  galeria    GaleriaPolaroid @relation(fields: [galeriaId], references: [id], onDelete: Cascade)
  galeriaId  String
}
```

---

## Pantallas que necesita el admin

### `/admin/galeria` — Listado de Galerías
- Tabla con: Nombre, Descripción, Nº fotos, Estado (publicada/borrador), Acciones
- Botón "Nueva galería"
- Filtro por estado

### `/admin/galeria/nueva` y `/admin/galeria/[id]/editar`
Campos del formulario:
- **Nombre** (requerido) — identificador interno, ej: "Convivencia Agosto 2024"
- **Descripción** (opcional) — texto corto para identificar la galería en admin
- **Slug** — autogenerado desde nombre, editable
- **Publicada** — toggle
- **Orden** — número para controlar el orden en la onepage
- **Fotos** — upload múltiple (drag & drop ideal), con:
  - Preview de cada foto subida
  - Campo de caption por foto
  - Reordenamiento drag & drop
  - Botón eliminar por foto

### Upload de imágenes
- Usar `sharp` para generar thumbnail (400px ancho) y versión optimizada
- Guardar en `/public/uploads/{año}/{mes}/` en dev
- Formato: convertir a webp
- Tamaño máximo: 5MB por foto

---

## Prop `lightboxMode` — comportamiento al hacer click en una foto

El componente acepta `lightboxMode?: "fullscreen" | "inline"`. El admin debe poder configurarlo por galería.

| Valor | Comportamiento | Cuándo usarlo |
|-------|---------------|---------------|
| `"fullscreen"` (default) | Abre overlay negro a pantalla completa con la foto en grande, flechas y contador | Sección Galería principal, uso standalone |
| `"inline"` | La foto seleccionada aparece centrada y agrandada **dentro del contenedor de la sección**, dimea las otras fotos, flechas en los bordes. Sin overlay. | Columna lateral dentro de secciones (Quiénes Somos, Convivencia, etc.) |

**Campos que necesita el modelo en BD:**
```prisma
model GaleriaPolaroid {
  // ...campos anteriores...
  lightboxMode  String  @default("fullscreen")  // "fullscreen" | "inline"
  desorden      Float   @default(0.8)           // 0.0 = orden perfecto, 1.0 = máximo caos
}
```

**Campos en el formulario admin:**
- **Modo de apertura** — selector: `Pantalla completa` / `Dentro de la sección`
- **Nivel de desorden** — slider 0–100 (se guarda como 0.0–1.0 en BD, normalizar al guardar: `desorden / 100`)
  - `0` → fotos alineadas en grid limpio
  - `50` → rotaciones y desplazamientos moderados
  - `100` → caos máximo (±12° rotación, ±20px desplazamiento)
  - Sugerencia de UI: mostrar etiquetas debajo del slider: `Ordenado — Casual — Caótico`

---

## Cómo conectar el componente en la onepage

Una vez que haya galerías en BD, el Server Component que use `GaleriaPolaroid` debería:

```ts
// Ejemplo de fetch en un Server Component
const galeria = await prisma.galeriaPolaroid.findFirst({
  where: { publicada: true },
  orderBy: { orden: 'asc' },
  include: {
    fotos: { orderBy: { orden: 'asc' } }
  }
});

// Pasar al componente cliente
<GaleriaPolaroid
  fotos={galeria.fotos.map(f => ({ src: f.src, caption: f.caption }))}
  lightboxMode={galeria.lightboxMode as "fullscreen" | "inline"}
/>
```

---

## Notas adicionales
- El componente puede usarse en múltiples secciones (Convivencia, Quiénes Somos, etc.) — no es exclusivo de la sección Galería.
- El campo `nombre` y `descripcion` son **solo para admin** — ayudan a identificar la galería internamente sin necesidad de abrirla.
- Considerar si se quiere que la galería tenga un título público visible sobre las fotos (campo extra `tituloPublico`).
