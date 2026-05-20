# Galerías — Arquitectura y uso

## Modelo mental: ¿quién carga las imágenes?

Los componentes de galería (`GaleriaPolaroid`, `GaleriaColumnas`) son **puramente de presentación**.
Tienen `"use client"` y no pueden leer el filesystem. Reciben `fotos` como prop.

La carga desde disco ocurre en el **componente servidor padre** (section o page).
La utilidad es `getMediaImages(directorio)` de `@/lib/media`.

```
public/media/{directorio}/   ←── pones los archivos aquí
       ↓
getMediaImages(directorio)   ←── server component lo lee (section o page)
       ↓
<GaleriaPolaroid fotos={...} />  ←── solo renderiza
```

---

## Dos galerías disponibles

### GaleriaPolaroid
Fotos en efecto polaroid dispersas, con hover, lightbox inline u fullscreen.

```tsx
import GaleriaPolaroid from "@/components/public/shared/GaleriaPolaroid";
// fotos: { src: string; caption: string }[]
<GaleriaPolaroid fotos={fotos} lightboxMode="inline" desorden={0.6} />
```

Props:
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `fotos` | `FotoPolaroid[]` | — | Array de `{ src, caption }` |
| `lightboxMode` | `"fullscreen" \| "inline"` | `"fullscreen"` | Cómo se amplía la foto al hacer clic |
| `desorden` | `0–1` | `0.8` | 0 = grilla ordenada, 1 = caos máximo |

### GaleriaColumnas
Mosaico masonry con lightbox, thumbnails y soporte de video local.

```tsx
import GaleriaColumnas from "@/components/public/shared/GaleriaColumnas";
// fotos: { src, width, height, alt, poster?, sources? }[]
<GaleriaColumnas fotos={fotos} />
```

Necesita dimensiones reales por foto (se obtienen con `sharp` — ver `Galeria.tsx` o `getFotosGrande` en eventos).

---

## Casos de uso y cómo agregarlos

### Caso A — Usar una sección existente (más fácil)

**QuienesSomos** acepta `directorioPolaroid` y carga las imágenes internamente:

```tsx
// En page.tsx o donde uses la sección:
<QuienesSomos
  mision="..."
  vision="..."
  resena="..."
  directorioPolaroid="MiSeccion/fotos"   // ← solo esto
/>
```

Pones las imágenes en `public/media/MiSeccion/fotos/` y listo.
Default si omites el prop: `"QuienesSomos/polaroid"`.

**Galeria** (sección masonry) no necesita props — lee siempre desde `public/media/Galeria/`.

---

### Caso B — Nueva sección con GaleriaPolaroid

El componente padre **debe ser un server component** (sin `"use client"`).

```tsx
// src/components/public/sections/MiSeccion.tsx
import { getMediaImages } from "@/lib/media";
import GaleriaPolaroid from "@/components/public/shared/GaleriaPolaroid";

interface MiSeccionProps {
  directorio?: string;
}

export default function MiSeccion({ directorio = "MiSeccion/fotos" }: MiSeccionProps) {
  const fotos = getMediaImages(directorio);
  return (
    <section>
      {fotos.length > 0 && <GaleriaPolaroid fotos={fotos} lightboxMode="inline" />}
    </section>
  );
}
```

Pones las imágenes en `public/media/MiSeccion/fotos/` y usas `<MiSeccion />` desde una page.

---

### Caso C — Nueva sección con GaleriaColumnas

Similar al anterior pero necesitas dimensiones (usa `sharp`):

```tsx
// src/components/public/sections/MiGaleria.tsx
import fs from "fs";
import path from "path";
import sharp from "sharp";
import GaleriaColumnas, { type FotoColumnas } from "@/components/public/shared/GaleriaColumnas";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function getFotos(directorio: string): Promise<FotoColumnas[]> {
  const dir = path.join(process.cwd(), "public", "media", directorio);
  if (!fs.existsSync(dir)) return [];

  const archivos = fs.readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  return Promise.all(
    archivos.map(async (archivo) => {
      try {
        const meta = await sharp(path.join(dir, archivo)).metadata();
        return { src: `/media/${directorio}/${encodeURIComponent(archivo)}`, width: meta.width ?? 1200, height: meta.height ?? 800, alt: "" };
      } catch {
        return { src: `/media/${directorio}/${encodeURIComponent(archivo)}`, width: 1200, height: 800, alt: "" };
      }
    })
  );
}

export default async function MiGaleria({ directorio = "MiGaleria" }: { directorio?: string }) {
  const fotos = await getFotos(directorio);
  return fotos.length > 0 ? <GaleriaColumnas fotos={fotos} /> : null;
}
```

Ver `src/components/public/sections/Galeria.tsx` como ejemplo completo.

---

## Reglas de archivos

- **Formato**: WebP (único formato aceptado — ver `public/media/IMAGENES.md`)
- **Nombres**: sin espacios — usar guión o guión bajo. `WhatsApp Image 2026...webp` funciona pero genera URLs con `%20` por los espacios; preferir `foto-01.webp`
- **Orden**: alfabético. Usar prefijo numérico (`01-`, `02-`) si importa el orden de aparición
- **Directorio**: siempre bajo `public/media/{Seccion}/` — la URL pública será `/media/{Seccion}/archivo.webp`

## ¿Por qué los componentes de galería no cargan desde disco?

Porque son `"use client"` — se ejecutan en el navegador, que no tiene acceso al filesystem del servidor.
El patrón Next.js es: server component lee datos → pasa como props → client component renderiza.
`getMediaImages` es server-only (importa `fs` de Node.js) y falla si se llama desde un client component.
