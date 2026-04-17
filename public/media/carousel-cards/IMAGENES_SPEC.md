# Especificaciones de imágenes — CarouselLinkCard

> Nota para después: estas son las especificaciones objetivo al preparar imágenes definitivas.

## Formato

| Atributo     | Valor                              |
|--------------|------------------------------------|
| Formato      | **WebP** (preferido) · JPG aceptado |
| Dimensiones  | **800 × 500 px** mínimo            |
| Ratio        | 16:10 o 16:9 (apaisado)            |
| Peso máximo  | **200 KB** por imagen              |
| Cantidad     | Exactamente **3** por card         |

## Convención de nombres

```
foto-1.webp
foto-2.webp
foto-3.webp
```

## Estructura de directorios

Cada instancia de `CarouselLinkCard` tiene su propio subdirectorio:

```
public/media/carousel-cards/
├── IMAGENES_SPEC.md       ← este archivo
├── convivencia/
│   ├── foto-1.webp
│   ├── foto-2.webp
│   └── foto-3.webp
└── <nueva-instancia>/
    ├── foto-1.webp
    ├── foto-2.webp
    └── foto-3.webp
```

## Notas de optimización

- Convertir a WebP con `cwebp -q 82 input.jpg -o output.webp` o con sharp en el pipeline.
- `object-cover` centra la imagen — el sujeto principal debe estar centrado horizontalmente.
- El tercio inferior queda cubierto por el gradient overlay negro; evitar texto o elementos importantes ahí.
- Si el directorio está vacío o `images` no se pasa al componente, se muestra un placeholder visual automáticamente.
