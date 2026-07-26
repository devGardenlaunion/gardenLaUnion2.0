# CarouselLinkCard

Componente de tarjeta-enlace con carousel de imágenes de fondo que pasan automáticamente (CSS puro, sin JS).
Pensado para usarse dentro de grids oscuros donde se necesita destacar un link a una sección o página.

## Props

| Prop        | Tipo       | Requerido | Descripción                                          |
|-------------|------------|-----------|------------------------------------------------------|
| `href`      | `string`   |           | Destino del link. **Si se omite**, la card es puramente visual: se renderiza como `<div>`, sin flecha ni hover de link |
| `title`     | `string`   | ✓         | Texto principal (CTA), aparece sobre la imagen       |
| `label`     | `string`   |           | Texto secundario pequeño encima del título           |
| `images`    | `string[]` | ✓         | Array de URLs/paths de imágenes (se usan las 3 primeras) |
| `className` | `string`   |           | Clases extra para el contenedor                      |

## Uso básico

```tsx
import CarouselLinkCard from "@/components/public/shared/CarouselLinkCard";

// Con link
<CarouselLinkCard
  href="/eventos/fomento-lector"
  title="Semana del Fomento Lector"
  label="Conoce el evento"
  images={[
    "/media/carousel-cards/convivencia/foto-1.webp",
    "/media/carousel-cards/convivencia/foto-2.webp",
    "/media/carousel-cards/convivencia/foto-3.webp",
  ]}
/>

// Solo visual (sin href) — así la usa la sección Sellos
<CarouselLinkCard
  title="Nuestra comunidad"
  label="Así se ve un día en Garden"
  images={[...]}
/>
```

## Dónde vive en producción

Sellos.tsx → BLOQUE 3 "Cómo lo vivimos", card visual del mosaico
(`lg:col-span-2 lg:row-span-2`, ocupa la columna derecha en dos filas).
Se usa **sin `href`**: la sección ya no enlaza a ninguna página aparte.

---

## NOTA PARA EL DESARROLLADOR

**Convención de imágenes:**
Cada instancia de `CarouselLinkCard` tiene su propio subdirectorio en:

```
public/media/carousel-cards/<nombre-del-card>/
```

Al crear una nueva instancia, crear el directorio correspondiente:

```bash
mkdir public/media/carousel-cards/<nombre-del-card>
```

Ejemplo para la card de convivencia:
```
public/media/carousel-cards/
└── convivencia/
    ├── foto-1.jpg
    ├── foto-2.jpg
    └── foto-3.jpg
```

**Requisitos de las imágenes:**
- Formato: `webp` (preferir webp para performance)
- Se usan **todas** las imágenes que reciba — el crossfade se ajusta solo a la cantidad.
- El componente entrega con `next/image` (responsive + lazy), así que no hay que
  pre-escalar a un tamaño exacto. Aun así, no subir originales gigantes: para el
  repo, capar a ~1600px de ancho y webp calidad ~72 (`sharp`). Un original de
  6000px pesa megas al vísimo y no aporta nada en una card de ~360px.

**Animación:**
El keyframe se genera en el propio componente según la cantidad de imágenes
(`keyframesPara(n)`), ya no vive en `globals.css`. Para cambiar la velocidad,
ajustar `SEG_POR_IMAGEN` en `CarouselLinkCard.tsx`. Con una sola imagen no anima.
