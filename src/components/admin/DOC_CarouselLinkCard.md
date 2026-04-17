# CarouselLinkCard

Componente de tarjeta-enlace con carousel de imágenes de fondo que pasan automáticamente (CSS puro, sin JS).
Pensado para usarse dentro de grids oscuros donde se necesita destacar un link a una sección o página.

## Props

| Prop        | Tipo       | Requerido | Descripción                                          |
|-------------|------------|-----------|------------------------------------------------------|
| `href`      | `string`   | ✓         | Destino del link                                     |
| `title`     | `string`   | ✓         | Texto principal (CTA), aparece sobre la imagen       |
| `label`     | `string`   |           | Texto secundario pequeño encima del título           |
| `images`    | `string[]` | ✓         | Array de URLs/paths de imágenes (se usan las 3 primeras) |
| `className` | `string`   |           | Clases extra para el contenedor                      |

## Uso básico

```tsx
import CarouselLinkCard from "@/components/public/shared/CarouselLinkCard";

<CarouselLinkCard
  href="/convivencia"
  title="Conoce nuestra historia"
  label="Descubre cómo construimos convivencia"
  images={[
    "/media/carousel-cards/convivencia/foto-1.jpg",
    "/media/carousel-cards/convivencia/foto-2.jpg",
    "/media/carousel-cards/convivencia/foto-3.jpg",
  ]}
/>
```

## Dónde vive en producción

Convivencia.tsx → BLOQUE 3 "Cómo lo vivimos", 4ª tarjeta del grid 2×2.

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
- Formato: `jpg` o `webp` (preferir webp para performance)
- Tamaño recomendado: 800×500 px mínimo (ratio 16:9 o similar apaisado)
- Peso: < 200 KB por imagen (el componente usa `object-cover`, no necesita resolución enorme)
- Se usan exactamente **3 imágenes** — el keyframe `carousel-fade` en `globals.css` está calibrado para ciclos de 3 (9s total, 3s por imagen con crossfade)

**Animación:**
El keyframe `carousel-fade` está en `src/app/globals.css`. Si en el futuro se necesita cambiar
la velocidad, ajustar la duración `9s` tanto en el keyframe como en el `style` del componente.
