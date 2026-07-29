# Contenido del sitio — dónde se edita cada cosa

> No hay panel de administración ni base de datos de contenido. **El contenido
> son archivos del repo.** Editás, `git push`, y el deploy lo publica.

---

## Mapa rápido

| Qué querés cambiar | Dónde |
|---|---|
| Textos del sitio (misión, sellos, contacto, admisión…) | `src/content/config.ts` |
| Eventos / Historias | `src/content/eventos.ts` + carpetas — ver [EVENTOS.md](./EVENTOS.md) |
| Fotos de una sección | `public/media/<Seccion>/` |
| Video del hero | `public/media/Hero/` |
| Documentos PDF | `public/documentos/` + `src/app/documentos/page.tsx` |
| Redes sociales | `src/data/redes.ts` |
| Links de recursos | `src/data/recursos.ts` |

---

## 1. Textos — `src/content/config.ts`

Un solo objeto con claves `grupo.campo`:

```ts
export const contenido = {
  "institucional.nombre": "Garden College",
  "sellos.titulo": "Un lugar donde tu hijo se siente seguro",
  "contacto.sede_basica.telefono": "(64) 232 4545",
  …
};
```

Los componentes lo leen con `config["clave"]`. **Cambiar un valor acá cambia el
sitio**, sin tocar componentes.

### Claves que son JSON

Algunas claves guardan estructuras, no texto suelto:

| Clave | Forma |
|---|---|
| `sellos.cards` | Array de `{titulo, descripcion, icono}`. **El orden define el mosaico**: la primera card es la destacada (ancha). |
| `sellos.cta` | `{cifra, texto, boton, href}` — la franja de cierre de Sellos. |
| `niveles.info` / `niveles.extras` | Arrays de niveles educativos. |
| `contacto.categorias` | Array de `{id, label}` — el desplegable "Motivo" del formulario de contacto. |

Iconos disponibles para `sellos.cards`: `book-open`, `heart-pulse`, `globe`,
`shield-check`, `users`, `sparkles`.

#### Cuidado con `contacto.categorias`

- **El `id` es una clave estable, no un texto.** Viaja en el asunto del correo
  (`[admision][media] …`) y en la cabecera `X-GC-Categoria`. Cambiarlo rompe los
  filtros que el colegio tenga armados en Gmail; cambiar el `label` no rompe nada.
- El server valida contra esta lista (`src/lib/categorias.ts`): un `id` que no
  esté acá se rechaza con 400, aunque alguien lo mande a mano.
- **No agregar categorías que prometan un destinatario** ("cita con dirección",
  "hablar con el profesor jefe"). El formulario es público y todo cae en la misma
  casilla: ofrecer un receptor concreto es una promesa que el colegio no controla,
  y además invita a saltarse el conducto regular. Se sacó una por este motivo.

---

## 2. Fotos por sección

Cada sección lee su carpeta. Tirás archivos ahí y aparecen solos:

```
public/media/
├── Hero/                        video de fondo + imagen (poster y fondo mobile)
├── Admision/                    carrusel de la sección Admisión
├── Galeria/                     galería general de la home
├── QuienesSomos/polaroid/       fotos polaroid
├── carousel-cards/convivencia/  carrusel de la card de Sellos
└── eventos/<slug>/              ver EVENTOS.md
```

**Antes de subir cualquier imagen:** convertir a webp, máximo 1600px de ancho,
calidad ~72. Los HEIC de iPhone y los DNG de cámara **no se ven en el navegador**
— hay que convertirlos. Los videos: sin audio, 24 fps, comprimidos.

El repo guarda la historia para siempre: **un archivo pesado que subas hoy queda
ahí aunque lo borres mañana.** Comprimir no es opcional.

---

## 3. Lo que todavía está hardcodeado

Estos textos viven dentro de componentes y deberían migrar a `config.ts` cuando
molesten:

- `src/components/public/sections/Recursos.tsx` — encabezados de la sección
- `src/app/documentos/page.tsx` — catálogo completo de PDFs
- `src/data/redes.ts` — URLs de redes sociales
- `src/data/recursos.ts` — links externos (incluye el ID del colegio en el SAE)

---

## 4. Cómo publicar

```bash
# 1. Editás el archivo de contenido
# 2. Verificás que compila
npm run build
# 3. Publicás
git add -A && git commit -m "contenido: actualizar X" && git push
```

El deploy toma el push y publica. **Todo el contenido va en el mismo commit que
el código** — no hay paso separado ni base de datos que sincronizar.

---

## 5. Por qué no hay panel de administración

Porque hoy hay **un solo editor, y sabe código**. Un panel existe para que gente
sin conocimientos técnicos pueda publicar; agregarlo ahora sumaría un login que
proteger, un endpoint de subida que asegurar y una base de datos que mantener,
a cambio de nada.

Además, Git ya da lo que un panel promete: historial de quién cambió qué y
cuándo, y poder volver atrás al instante.

**Cuándo reconsiderarlo:** el día que alguien del colegio necesite publicar sin
depender de un desarrollador. Ese día se repone la base de datos y se migra el
contenido de estos archivos. Ver `docs/admin/REQUISITOS.md`, que sigue vigente
como especificación.
