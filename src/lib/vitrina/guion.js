/**
 * **El guion de la vitrina del colegio** (dev, 2026-11-21: «mostrar el colegio en loop, una versión larga y otra
 * corta; la info sale de gardenlaunion 2.0»). La idea viene de la vitrina de feria de CampoData; acá no se muestra
 * el sistema sino el colegio.
 *
 * Todo sale de `contenido.json` (lo escribe `scripts/vitrina-contenido.mjs`): textos, eventos y la lista de fotos y
 * videos. Este archivo solo decide **qué va, en qué orden y cuánto dura**. Un evento nuevo en la
 * web entra solo en las dos versiones al volver a correr el script.
 *
 * El guion es una lista plana de **pasos** (cada foto es un paso), así «Anterior» y «Siguiente» van de a uno. Cada
 * paso tiene `tipo` (lo dibuja `components/vitrina/Vitrina.jsx`) y `segundos`. Los textos van a 3–4 m de distancia:
 * en la corta solo títulos y extractos; los párrafos largos, solo en la larga.
 */
import contenido from './contenido.json'

export const VERSIONES = Object.freeze({
  corta: { nombre: 'Versión corta', que: 'Lo esencial, para que se vea de pasada.' },
  larga: {
    nombre: 'Versión larga',
    que: 'El colegio con calma: historia, sellos, niveles y cada evento.',
  },
})

/**
 * **Dos pantallas** (dev, 2026-11-23: «otro en versión pantalla vertical, esas que son como un stand»): `horizontal`
 * (una TV, 16:9) y `vertical` (un tótem de pie, 9:16; los de 43–55" son 1080 × 1920). El guion es el mismo; en la
 * vertical, las muestras de fotos **prefieren las verticales** (llenan la pantalla en vez de quedar en una franja). La
 * disposición de cada lámina la cambia el CSS (`.vitrina.vertical`).
 */
export const PANTALLAS = Object.freeze({
  horizontal: { nombre: 'Horizontal', que: 'Una TV o un proyector.' },
  vertical: { nombre: 'Vertical (tótem)', que: 'Una pantalla de pie, 9:16.' },
})

const verticales = new Set(contenido.verticales ?? [])
let enVertical = false

/** `n` elementos repartidos a lo largo de la lista (no los primeros: una galería se ordena por nombre de archivo). */
export function muestra(todas, n) {
  // En el tótem, las verticales primero si alcanzan; si no, todas.
  const solo = enVertical ? todas.filter((f) => verticales.has(f)) : todas
  const lista = solo.length >= Math.min(n, todas.length) ? solo : todas
  if (lista.length <= n) return lista
  return Array.from({ length: n }, (_, k) => lista[Math.floor((k * lista.length) / n)])
}

const fotos = (lista, rotulo, titulo, segundos) =>
  lista.map((src) => ({ tipo: 'foto', src, rotulo, titulo, segundos }))

function portada(c, segundos) {
  return {
    tipo: 'portada',
    logo: c.medios.logo,
    // El león junto al GC (dev, 2026-11-21).
    escudo: c.medios.escudoGrande ?? c.medios.escudo,
    nombre: c.colegio.nombre,
    slogan: c.colegio.slogan,
    ciudad: c.colegio.ciudad,
    segundos,
  }
}

/** Adonde va el QR: la página con todos los enlaces del colegio, no la portada (dev, 2026-11-21). */
const destinoDelQr = (c) => c.sitio

/**
 * **Las redes y el QR, cada cierto rato** (dev, 2026-11-21: «dejar cada cierto rato nuestras redes y el QR»). Quien
 * mira la pantalla de pasada no espera al final: `conRedes` la intercala entre las partes.
 */
function redes(c, segundos = 12) {
  return {
    tipo: 'redes',
    parte: 'Redes y QR',
    escudo: c.medios.escudo,
    sitio: destinoDelQr(c),
    redes: c.redes ?? [],
    segundos,
  }
}

/**
 * Pone la lámina de redes en un corte (entre partes o tras un video) cada vez que pasaron `cada` segundos desde la última vez que se vio un QR.
 * Nunca justo antes del cierre (que ya lleva el QR) ni al principio.
 */
function conRedes(pasos, c, cada) {
  const r = []
  let desdeElUltimo = 0
  pasos.forEach((p, k) => {
    r.push(p)
    desdeElUltimo += p.segundos
    if (p.tipo === 'cierre') desdeElUltimo = 0
    const siguiente = pasos[k + 1]
    const terminaParte = siguiente && siguiente.parte !== p.parte
    const antesDelCierre =
      siguiente &&
      pasos.slice(k + 1).every((x) => x.parte === siguiente.parte) &&
      pasos.at(-1).tipo === 'cierre'
    // Un corte natural: entre dos partes o al terminar un video (la Gala sola dura 8 minutos).
    const corte = terminaParte || (p.tipo === 'video' && siguiente)
    if (corte && !antesDelCierre && desdeElUltimo >= cada) {
      r.push(redes(c))
      desdeElUltimo = 0
    }
  })
  return r
}

function cierre(c, segundos) {
  return {
    tipo: 'cierre',
    escudo: c.medios.escudo,
    sitio: destinoDelQr(c),
    admision: c.admision.info,
    sedes: c.sedes,
    segundos,
  }
}

/**
 * **El mosaico de cada nivel** (dev, 2026-11-21: «hazme un mix de imágenes en la parte de los niveles, y no ocupes esas
 * imágenes»: las de `Niveles/` en la web son de 800 px y se rompen en grande). Elegidas a mano mirando las fotos de la
 * web, todas de 1600 px o más: el día a día y la Gala, de niños que se ven de ese nivel. Si la web saca una, se cae
 * sola del mosaico (`guionDe`); si cambian los niveles, se eligen otras acá.
 */
export const FOTOS_DE_NIVELES = Object.freeze({
  prebasica: [
    '/media/Galeria/IMG_7188-min_resultado.webp',
    '/media/eventos/gala-folclorica/2026/GALA_GARDEN_2026-1.webp',
    '/media/eventos/gala-folclorica/2026/IMG_9358.webp',
    '/media/eventos/gala-folclorica/2026/_DSC0614.webp',
  ],
  basica: [
    '/media/Galeria/IMG_3396.webp',
    '/media/eventos/gala-folclorica/2026/GALA_GARDEN_2026-109.webp',
    '/media/eventos/gala-folclorica/2026/_DSC0064.webp',
    '/media/eventos/gala-folclorica/2026/_DSC0094.webp',
  ],
  media: [
    '/media/Admision/admision-06.webp',
    '/media/QuienesSomos/polaroid/IMG_6936-min_resultado.webp',
    '/media/QuienesSomos/polaroid/20250527_151201_resultado.webp',
    '/media/eventos/gala-folclorica/2025/IMG_5100.webp',
  ],
})

/** Cada nivel con su mosaico y el nombre de su sede (la web dice solo la calle: «Los Carrera 387»). */
const niveles = (c) =>
  c.niveles.map((n) => ({
    ...n,
    fotos: (FOTOS_DE_NIVELES[n.slug] ?? []).filter((f) => enLaWeb.has(f)),
    sedeNombre: c.sedes.find((s) => s.direccion.startsWith(n.sede))?.nombre ?? null,
  }))

/**
 * Un video: entero si `tope` no se da (la versión larga), o solo sus primeros `tope` segundos. `vertical` es su versión
 * para el teléfono (4:5 o cuadrada), que en el tótem reemplaza a la horizontal; su póster, `posterVertical` en `extra`.
 */
const video = (horizontal, extra, tope, vertical) => {
  const v = (enVertical && vertical) || horizontal
  const { posterVertical, ...resto } = extra
  if (enVertical && vertical) resto.poster = posterVertical ?? resto.poster
  return v && {
    tipo: 'video',
    src: v.src,
    ...resto,
    segundos: tope ? Math.min(tope, v.segundos) : v.segundos,
  }
}
/** Marca a qué parte pertenece cada paso: el módulo muestra el índice de cada versión con esto. */
const parte = (nombre, ...pasos) =>
  pasos
    .flat(Number.POSITIVE_INFINITY)
    .filter(Boolean)
    .map((p) => ({ ...p, parte: nombre }))

function corta(c) {
  return [
    parte('Portada', portada(c, 7)),
    parte('Video del colegio', video(c.medios.hero.video, { poster: c.medios.hero.poster, posterVertical: c.medios.hero.posterVertical }, 18, c.medios.hero.videoVertical)),
    parte('Sellos', {
      tipo: 'sellos',
      titulo: c.sellos.titulo,
      tarjetas: c.sellos.tarjetas,
      segundos: 12,
    }),
    parte('Niveles', { tipo: 'niveles', niveles: niveles(c), extras: c.extras, segundos: 14 }),
    ...c.eventos.map((e) =>
      parte(
        e.nombre,
        video(
          e.video,
          { poster: e.portada, rotulo: 'Lo que vivimos', titulo: e.nombre, texto: e.extracto },
          10,
          e.videoVertical,
        ),
        fotos(muestra(e.polaroid, 3), 'Lo que vivimos', e.nombre, 5),
      ),
    ),
    parte(
      'Cierre con QR',
      {
        tipo: 'cifra',
        cifra: c.sellos.cifra,
        texto: 'Años formando comunidad en La Unión.',
        segundos: 7,
      },
      cierre(c, 14),
    ),
  ].flat()
}

function larga(c) {
  const comunidad = [...c.medios.convivencia, ...c.medios.quienesSomos]
  return [
    parte('Portada', portada(c, 10)),
    // Entero (dev, 2026-11-21: «la versión larga debería tener el video completo»).
    parte('Video del colegio', video(c.medios.hero.video, { poster: c.medios.hero.poster, posterVertical: c.medios.hero.posterVertical }, undefined, c.medios.hero.videoVertical)),
    parte(
      'Quiénes somos',
      {
        tipo: 'lamina',
        rotulo: 'Quiénes somos',
        titulo: `${c.colegio.nombre}, ${c.colegio.ciudad}`,
        texto: c.colegio.resena,
        fondo: c.medios.quienesSomos[0],
        segundos: 16,
      },
      { tipo: 'cifra', cifra: c.sellos.cifra, texto: c.sellos.cifraTexto, segundos: 8 },
      {
        tipo: 'lamina',
        rotulo: 'Misión',
        texto: c.colegio.mision,
        fondo: c.medios.quienesSomos[3],
        segundos: 16,
      },
      {
        tipo: 'lamina',
        rotulo: 'Visión',
        texto: c.colegio.vision,
        fondo: c.medios.quienesSomos[6],
        segundos: 15,
      },
      fotos(muestra(c.medios.quienesSomos, 6), 'Nuestra comunidad', null, 6),
    ),
    parte(
      'Sellos',
      {
        tipo: 'lamina',
        rotulo: 'Nuestros sellos',
        titulo: c.sellos.titulo,
        texto: c.sellos.descripcion,
        fondo: c.medios.convivencia[0],
        segundos: 14,
      },
      c.sellos.tarjetas.map((t, k) => ({
        tipo: 'sello',
        ...t,
        foto: comunidad[(k * 2 + 1) % comunidad.length],
        segundos: 12,
      })),
    ),
    parte(
      'Niveles',
      { tipo: 'niveles', niveles: niveles(c), segundos: 12 },
      niveles(c).map((n) => ({ tipo: 'nivel', ...n, segundos: 14 })),
      {
        tipo: 'lista',
        rotulo: 'Además',
        titulo: 'Lo que nos distingue',
        items: c.extras,
        segundos: 12,
      },
    ),
    ...c.eventos.map((e) =>
      parte(
        e.nombre,
        video(
          e.video,
          { poster: e.portada, rotulo: 'Lo que vivimos', titulo: e.nombre },
          undefined,
          e.videoVertical,
        ),
        {
          tipo: 'lamina',
          rotulo: 'Lo que vivimos',
          titulo: e.titulo,
          texto: e.extracto,
          fondo: e.polaroid[0],
          segundos: 12,
        },
        fotos(e.polaroid, 'Lo que vivimos', e.nombre, 5),
        // Cada año: sus videos enteros («tenemos caleta de videos») y una muestra de sus fotos.
        e.galerias.map((g) => [
          g.videos.map((v) => video(v, { rotulo: e.nombre, titulo: g.anio })),
          fotos(muestra(g.fotos, 6), e.nombre, g.anio, 4),
        ]),
      ),
    ),
    parte('Galería', fotos(c.medios.galeria, 'Galería', 'Momentos Garden', 5)),
    parte(
      'Admisión y cierre con QR',
      {
        tipo: 'lamina',
        rotulo: 'Admisión',
        titulo: 'Ven a conocernos',
        texto: c.admision.info,
        fondo: c.medios.admision[0],
        segundos: 12,
      },
      fotos(muestra(c.medios.admision.slice(1), 4), 'Admisión', null, 5),
      cierre(c, 15),
    ),
  ].flat()
}

/** Los pasos de una versión, sin los que les falta su foto o su video (la web pudo haberlos sacado). */
export function guionDe(version, pantalla = 'horizontal', c = contenido) {
  enVertical = pantalla === 'vertical'
  const pasos = (version === 'larga' ? larga : corta)(c).filter((p) =>
    p.tipo === 'foto' || p.tipo === 'video' ? p.src : true,
  )
  // En la corta (2 min) una vez a la mitad; en la larga, cada unos 4 minutos.
  return conRedes(pasos, c, version === 'larga' ? 240 : 45)
}

/** Lo que hay en la web: el script (`scripts/vitrina-contenido.mjs`) solo anota lo que existe y es grande. */
const enLaWeb = new Set(
  [
    ...Object.values(contenido.medios).flat(),
    ...contenido.eventos.flatMap((e) => [...e.polaroid, ...e.galerias.flatMap((g) => g.fotos)]),
  ].filter((x) => typeof x === 'string'),
)
for (const [nivel, lista] of Object.entries(FOTOS_DE_NIVELES)) {
  const faltan = lista.filter((f) => !enLaWeb.has(f))
  if (faltan.length) console.warn(`[vitrina] Fotos de ${nivel} que ya no están en la web:`, faltan)
}

/** Las partes de una versión, en orden, con cuántos pasos y segundos tiene cada una (el índice del módulo). */
export function partesDe(pasos) {
  const r = []
  for (const p of pasos) {
    const ultima = r.at(-1)
    if (ultima?.nombre === p.parte) {
      ultima.pasos += 1
      ultima.segundos += p.segundos
    } else r.push({ nombre: p.parte, desde: r.length, pasos: 1, segundos: p.segundos })
  }
  return r
}

/** Cuánto dura una vuelta, en segundos (un video corto puede terminar antes). */
export const duracionDe = (pasos) => pasos.reduce((s, p) => s + p.segundos, 0)

/** Todo lo que hay que bajar para que la vuelta corra sin red. */
export function archivosDe(pasos) {
  const r = new Set()
  for (const p of pasos) {
    for (const k of ['src', 'poster', 'logo', 'escudo', 'fondo', 'foto']) if (p[k]) r.add(p[k])
    // En el paso de un nivel, `niveles` es el texto de sus cursos («1° a 6° Básico»); solo el resumen trae la lista.
    const todos = Array.isArray(p.niveles) ? p.niveles : []
    for (const f of [...todos.flatMap((n) => n.fotos), ...(p.fotos ?? [])]) r.add(f)
  }
  return [...r]
}

export const qrDeLaVitrina = contenido.qr
export const generadoEl = contenido.generado
