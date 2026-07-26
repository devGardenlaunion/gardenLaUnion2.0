# Eventos — cómo agregar y mantener

> **Regla de oro:** el texto vive en `src/content/eventos.ts`, las fotos viven en
> carpetas. No hay base de datos, no hay panel. Editás, hacés push, se publica.

---

## 1. El modelo mental

Un **evento** es permanente: la Semana del Fomento Lector existe todos los años y
su relato no cambia. Lo que cambia cada año es la **galería de fotos**.

```
EVENTO (permanente)                    ← texto en src/content/eventos.ts
   │  nombre, extracto, narrativa
   │
   ├── hero/       video o imagen de portada   (permanente)
   ├── polaroid/   fotos del bloque polaroid   (permanente)
   │
   ├── 2026/  ← edición: galería de ese año
   └── 2027/  ← edición: se agrega sola cuando creás la carpeta
```

**Los años NO se declaran en el código.** El sitio lee las carpetas de
`public/media/eventos/<slug>/` y toma como año toda carpeta que se llame con 4
dígitos. Creás `2027/`, tirás las fotos adentro, y el evento pasa a mostrar 2027
con 2026 listado como edición anterior. Sin tocar un `.ts`.

---

## 2. Agregar un evento nuevo

### Paso 1 — el texto

En `src/content/eventos.ts`, copiar un bloque existente y cambiar los valores:

```ts
{
  slug: "fiestas-patrias",              // URL: /eventos/fiestas-patrias
  nombre: "Fiestas Patrias",            // badge y título en la web
  titulo: "Una semana de chilenidad",   // título de la edición
  extracto: "Ramadas, cueca, empanadas…",  // bajada corta (card y blockquote)
  fecha: "2026-09-19",                  // define el MES que se muestra
  destacado: false,                     // true = es el hero grande de Historias
  publicado: false,                     // false = preparado pero invisible
  texto: `
    Primer párrafo del relato.

    Segundo párrafo. Se separan con una línea en blanco.
  `,
},
```

### Paso 2 — las carpetas

```
public/media/eventos/fiestas-patrias/
├── hero/       ← 1 video (.webm/.mp4) o 1 imagen de portada
├── polaroid/   ← 4 a 12 fotos para el bloque polaroid
└── 2026/       ← todas las fotos de la galería grande
```

### Paso 3 — publicar

Cuando el texto y las fotos estén, poner `publicado: true`, commit y push.

---

## 3. Reglas de los campos

| Campo | Regla |
|---|---|
| `slug` | Minúsculas con guiones. **Debe coincidir** con el nombre de la carpeta en `public/media/eventos/`. No cambiarlo después: es la URL. |
| `destacado` | **Solo uno** en `true`. Es el hero grande de Historias. Si ninguno lo está, se usa el más reciente. |
| `publicado` | `false` deja el evento preparado pero fuera del sitio. Sirve para dejar todo listo y publicar el día que corresponde. |
| `fecha` | ISO `YYYY-MM-DD`. Se muestra solo el mes, y ordena los eventos entre sí. |
| `texto` | Párrafos separados por **línea en blanco**. Sin HTML. |
| `extracto` | 1–2 líneas. Aparece en la card de la home y como blockquote en la subpágina. |
| `edicionActiva` | Opcional. Ver abajo. |

---

## 4. Cambiar qué edición (galería) se muestra

Por defecto se muestra **el año más reciente** que tenga carpeta. Para fijar otro
—por ejemplo, mientras armás la galería del año nuevo y no querés publicarla
todavía— agregá `edicionActiva`:

```ts
{
  slug: "fomento-lector",
  edicionActiva: 2026,   // muestra 2026 aunque exista la carpeta 2027
  …
}
```

Si el año declarado no tiene carpeta, el sitio ignora el campo y usa el más
reciente que exista. Los otros años aparecen listados como "ediciones anteriores".

---

## 5. Media — reglas que no se negocian

- **Comprimir SIEMPRE antes de commitear.** El repo guarda la historia para
  siempre: un archivo pesado que subas hoy queda ahí aunque lo borres mañana.
- **Fotos:** webp, máximo 1600px de ancho, calidad ~72. Una foto de celular de
  5 MB baja a ~100 KB sin diferencia visible.
- **Videos:** sin audio, 24 fps, `scale=1280:-2`. Un export 4K de 256 MB baja a
  ~2,7 MB. Ver los comandos exactos en `docs/admin/REQUISITOS.md` → Videos.
- **Formatos de celular:** HEIC (iPhone) y DNG (RAW) **no se ven en el
  navegador**. Hay que convertirlos a webp antes de subirlos.
- **Video con poster:** si subís `clip.mp4` a una galería, poné también
  `clip.webp` (mismo nombre) como miniatura. El sitio los aparea solo y excluye
  el poster de la tira de fotos.

> Si no querés hacer la compresión a mano, pedísela a Claude: "comprimí estas
> fotos para el evento X". El pipeline está documentado y probado.

---

## 6. Qué NO existe (y por qué)

| No existe | Por qué |
|---|---|
| Tabla `Evento`/`Edicion` en BD | El contenido lo edita una sola persona, que sabe código. Git ya es el historial y el control de versiones. |
| Panel para cargar eventos | Ver arriba. Si algún día alguien del colegio necesita publicar sin desarrollador, ahí se justifica — no antes. |
| Campo `contenido` en HTML | Se unificó en `texto` (párrafos planos). Menos formatos, nada que sanitizar. |
| Tabla `Multimedia` | Las fotos siempre vinieron del filesystem; la tabla estaba vacía. |

---

## 7. Checklist para publicar

- [ ] Bloque agregado en `src/content/eventos.ts`
- [ ] Carpetas `hero/`, `polaroid/`, `<año>/` creadas
- [ ] Fotos comprimidas (webp ≤1600px) y videos comprimidos
- [ ] Videos con su poster `.webp` del mismo nombre
- [ ] `destacado`: solo uno en todo el archivo
- [ ] `publicado: true`
- [ ] `npm run build` pasa
- [ ] Commit + push
