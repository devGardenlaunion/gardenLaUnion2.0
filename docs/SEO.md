# SEO — qué emite el sitio y por qué

> Objetivo declarado: aparecer primero en las búsquedas de Google de gente que
> busca colegio en La Unión. Este documento registra qué se implementó, dónde
> vive cada cosa, y qué falta hacer **fuera** del repositorio.
>
> Dominio canónico: **https://gardenlaunion.cl**

---

## La idea de fondo

El sitio no compite por "colegio" a nivel nacional — compite por **búsquedas
locales**: "colegios en La Unión", "colegio inglés La Unión", "admisión colegio
La Unión Los Ríos". Ahí el que gana no es el que tiene más contenido, sino el
que Google entiende mejor: qué es, dónde queda, qué imparte y a quién sirve.

Todo lo de abajo apunta a eso.

---

## Dónde vive cada cosa

| Archivo | Qué hace |
|---------|----------|
| `src/lib/seo.ts` | URL canónica (`SITE_URL`, `absUrl`) y los datos estructurados JSON-LD. **Lee de `src/content/config.ts`** — no duplica datos. |
| `src/app/layout.tsx` | Metadata base: title, description, keywords, Open Graph, Twitter, robots, favicon, `lang="es-CL"`. Inyecta el JSON-LD del colegio. |
| `src/app/sitemap.ts` | `sitemap.xml` generado en el build desde el contenido real. |
| `src/app/robots.ts` | `robots.txt`. Bloquea por completo los deploys de preview. |
| `src/components/public/shared/JsonLd.tsx` | Inyecta un bloque JSON-LD en el HTML (Server Component: sale en el HTML del build). |
| `scripts/generar-og-image.js` | Genera `public/og-image.jpg`, la tarjeta de redes sociales. |

**Regla:** los datos del colegio (dirección, teléfonos, RBD, director,
coordenadas, redes) salen siempre de `src/content/config.ts`. Si un dato cambia
ahí, cambia también en el JSON-LD sin tocar nada más.

---

## Datos estructurados (JSON-LD)

Es la pieza de mayor impacto para búsqueda local, y la que faltaba por completo.

### En todas las páginas — `School` + `WebSite`

`School` es el tipo correcto: hereda de `EducationalOrganization` **y** de
`LocalBusiness`, así que sirve tanto al panel de conocimiento como al mapa.

Lo que se declara:

- Nombre, nombres alternativos (`Garden La Unión`, `El colegio inglés de La Unión`),
  razón social, reseña, slogan, logo e imagen.
- **`identifier` = RBD 22743-9.** El identificador oficial ante el Mineduc: le
  permite a Google conciliar el sitio con los registros públicos del colegio.
- `foundingDate` 2004-10-29 y el director como `employee`.
- **Las dos sedes** como `Place`, cada una con `PostalAddress` completa,
  teléfono en formato E.164 y `GeoCoordinates`. Esto es lo que alimenta las
  búsquedas de tipo "colegio cerca de mí".
- `areaServed`: La Unión, Provincia del Ranco, Región de Los Ríos.
- `hasOfferCatalog` con los tres niveles (Prebásica, Básica, Media) como
  `Course` — le dice a Google para qué búsquedas califica el colegio.
- `sameAs` con Facebook, Instagram y YouTube, para que Google enlace el sitio
  con los perfiles oficiales.

### En páginas de evento — `BreadcrumbList`

Inicio → Historias → nombre del evento. Google muestra las migas en el
resultado en vez de la URL cruda.

### Cómo verificarlo

```bash
npm run build
# El JSON-LD queda en el HTML generado:
grep -o 'application/ld+json.\{0,400\}' .next/server/app/index.html
```

Y ya publicado, contra el sitio real:

- <https://search.google.com/test/rich-results>
- <https://validator.schema.org/>

---

## Metadatos

### Títulos

| Página | Title |
|--------|-------|
| `/` | `Garden College — Colegio en La Unión, Región de Los Ríos` |
| `/documentos` | `Documentos institucionales \| Garden College La Unión` |
| `/eventos/[slug]` | `<nombre del evento> \| Garden College La Unión` |

El title de la home lleva la palabra **"Colegio"** a propósito: la búsqueda que
trae apoderados nuevos es "colegios en La Unión", no la marca. Quien ya conoce
el nombre llega igual.

La `description` de la home se acortó a 152 caracteres — la anterior tenía 205 y
Google la truncaba a media frase.

### Canónicas

Cada página declara su `alternates.canonical`. Importa especialmente en
`/documentos`: el parámetro `?doc=` abre distintos PDF pero **es la misma
página**, y sin canonical fijo Google vería 19 URLs con contenido idéntico.

`absUrl()` en `src/lib/seo.ts` produce exactamente la misma forma que emite Next
en el `<link rel="canonical">` (raíz sin barra final). Si el sitemap y el
canonical no coinciden carácter a carácter, Google los trata como dos URLs
distintas y reparte el posicionamiento entre ambas.

### Redes sociales

Antes no había ninguna imagen: los links compartidos por WhatsApp salían en
blanco. Ahora hay `public/og-image.jpg` (1200×630) con logo, nombre, slogan y
ubicación.

Es una **tarjeta de marca y no una foto** a propósito: las redes cachean esa
imagen de forma indefinida y no corresponde congelar ahí una foto de
estudiantes. Las páginas de evento sí usan su portada real, que es contenido
específico de esa nota.

Para regenerarla tras cambiar el logo o el slogan:

```bash
node scripts/generar-og-image.js
```

---

## Consistencia de marca (crítico para el posicionamiento)

Google no muestra el logo del `<header>` en los resultados: arma la identidad de
la marca con **cuatro touchpoints separados**, y si no coinciden entre sí, se
diluye el reconocimiento de marca (que sí influye en CTR y en cómo Google
construye la *entidad* del colegio en su grafo de conocimiento).

| Touchpoint | Dónde se ve | Archivo |
|---|---|---|
| **Favicon** | Junto al nombre en los resultados (móvil) | `public/favicon.svg` |
| **`logo` structured data** | Knowledge panel / rich results | `src/lib/seo.ts` → `School.logo` |
| **Apple touch icon** | Marcador en iOS | `src/app/layout.tsx` → `icons.apple` |
| **OG image** | Preview al compartir (WhatsApp, redes) | `public/og-image.jpg` |

**Regla:** los cuatro deben mostrar el MISMO isotipo que el logo visible del
sitio. Cuando se cambia la identidad, se actualizan los cuatro juntos — si no,
Google muestra una marca y el sitio otra.

> Favicon: para máxima compatibilidad conviene un PNG múltiplo de 48 (el tamaño
> que Google reescala). El favicon debe ser **cuadrado y legible a 16px**: nada
> de texto largo ni detalle fino que se pierda.

**Estado actual (rama `feat/uniformes` — rebrand oficializado):** los cuatro
touchpoints muestran el **isotipo GC** (navy + monograma dorado), igual que la
UI del sitio:

- **Favicon:** `favicon.svg` (+ `favicon.png` 96×96) — GC centrado, legible a 16px.
- **Structured data `logo`:** `gc-identidad.png`.
- **Apple touch icon:** `gc-identidad.png`.
- **OG image:** `og-image.jpg` regenerada con el isotipo + gradiente navy.

El león queda sólo como capa secundaria del loop del navbar (con `alt=""`, no es
señal de marca para Google). El isotipo GC lee limpio a 16px — a diferencia del
badge del león, que como escudo detallado se volvía una mancha a ese tamaño.

---

## Texto alternativo de las imágenes

El `alt` se derivaba del nombre del archivo, así que el sitio publicaba cosas
como `IMG 0213`, `40521008 Unknown resultado` y
`WhatsApp Image 2026 03 23 at 5.17.51 PM` en más de 100 imágenes. Eso es ruido:
es lo que indexa Google Imágenes y lo que escucha quien usa lector de pantalla.

`altDesdeArchivo()` en `src/lib/media.ts` resuelve así:

1. Si el nombre trae marcas de volcado de cámara/WhatsApp/iOS (`IMG_`,
   `whatsapp`, `unknown`, `screenshot`, 6+ dígitos seguidos, UUID) → se
   descarta entero y se usa un texto de contexto.
2. Si no, se limpian sufijos de herramienta (`_resultado`, `-min`, `-lofi`),
   relaciones de aspecto (`(16-9)`) y se separa camelCase.
3. Si no queda ninguna palabra de 3+ letras → texto de contexto.

Sobre los 147 archivos actuales: **123 caen al texto de contexto y 24 conservan
un nombre legible.**

El contexto lo pasa quien llama, con lo que sabe de la sección. Ejemplos reales:

- Galería de la home → `Comunidad escolar de Garden College, La Unión — Región de Los Ríos`
- Página de evento → `Semana del Fomento Lector 2026 en Garden College, La Unión`
- Niveles → `Prebásica (Pre-Kínder y Kínder) en Garden College, La Unión`

Quedan `alt=""` a propósito los fondos desenfocados de los carruseles y las
diapositivas que no son la primera: están apiladas en el mismo lugar y todas van
con `aria-hidden`. Si todas llevaran texto, un lector de pantalla leería N
descripciones de algo que se ve como una sola imagen.

---

## Otros arreglos con efecto en posicionamiento

- **`<h1>` de las páginas de evento.** Repetía el mismo texto del badge que
  tiene justo encima (`Semana del Fomento Lector` dos veces), y el campo
  `titulo` — descriptivo y con la edición del año — no se usaba en ninguna
  parte. Ahora el `h1` usa `titulo`.
- **Placeholders de `picsum.photos` eliminados.** Si una carpeta de fotos
  quedaba vacía, el sitio servía imágenes de stock aleatorias desde un dominio
  de terceros, con `alt` que no correspondía a lo que se veía, y en el LCP del
  móvil. Ahora: carpeta vacía = sección que no se renderiza.
- **Imagen del hero en móvil.** Es el LCP para la mayoría de las visitas (los
  apoderados entran por celular) y se cargaba sin prioridad. Ahora va con
  `fetchPriority="high"`. Core Web Vitals es factor de ranking.
- **`lang="es"` → `lang="es-CL"`.** Le indica a Google la variante regional.
- **`minimumCacheTTL` de un año** para las imágenes optimizadas: los medios no
  cambian sin un deploy.
- **Redirect `www` → apex** con 301 permanente en `next.config.js`.
- **Previews de Vercel bloqueados en `robots.txt`.** Sin esto, Google puede
  indexar `garden-web-xxxx.vercel.app` y que ese dominio compita con el real.

---

## Pendiente — fuera del repositorio

Esto no se puede hacer con código. Es lo que falta para capitalizar lo anterior:

- [ ] **Google Search Console**: verificar la propiedad de `gardenlaunion.cl` y
      enviar `https://gardenlaunion.cl/sitemap.xml`. Hay un campo
      `verification.google` preparado y comentado en `src/app/layout.tsx` si se
      prefiere verificar por meta tag.
- [ ] **Google Business Profile** (ex Google My Business) para **cada sede**, con
      la misma dirección y teléfono que `src/content/config.ts`. Para búsqueda
      local esto pesa tanto como el sitio: es lo que pone al colegio en el mapa.
      La coherencia exacta del nombre, dirección y teléfono entre el perfil y el
      JSON-LD es lo que hace que Google los asocie.
- [ ] Validar en <https://search.google.com/test/rich-results> con la URL real.
- [ ] Correr Lighthouse móvil sobre producción (objetivo declarado en
      `CLAUDE.md`: >80 en todas las métricas).
- [ ] Revisar que las fichas del colegio en directorios educativos y en el SAE
      del Mineduc apunten a `gardenlaunion.cl`. Los enlaces entrantes desde
      sitios del rubro son la señal externa más barata de conseguir.

---

## Ver también

- [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) — publicación y variables de entorno.
- [CONTENIDO.md](./CONTENIDO.md) — dónde se edita cada texto y foto.
