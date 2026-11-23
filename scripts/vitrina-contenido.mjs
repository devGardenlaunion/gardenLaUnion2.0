/**
 * **Lo que sabe la vitrina del colegio** (`/vitrina`). Se corre a mano cuando cambia el contenido (un evento nuevo,
 * otra foto) y se commitea el JSON:
 *
 *   node scripts/vitrina-contenido.mjs        (Node 22.18+ o 24: importa los .ts quitando los tipos; pide ffprobe)
 *
 * Lee los textos (`src/content/config.ts`, `src/content/eventos.ts`, `src/data/redes.ts`) y la lista de fotos y videos
 * de `public/media/`, y escribe `src/lib/vitrina/contenido.json`, que `src/app/vitrina/page.tsx` arma en el build.
 * Se mide aquí y no en el build porque pide `ffprobe` (duración de los videos, medida de las fotos). Los archivos no se
 * copian: la vitrina los pide a `/media/…` como el sitio.
 *
 * Vino de gcadmin (2026-11-23, dev: «ya que vitrina solo pide un login, podríamos pasarlo a gardenlaunion.cl»).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import QRCode from 'qrcode';

const web = path.resolve(import.meta.dirname, '..');
const media = path.join(web, 'public', 'media');

const { contenido: c } = await import(pathToFileURL(path.join(web, 'src/content/config.ts')).href);
const { eventos } = await import(pathToFileURL(path.join(web, 'src/content/eventos.ts')).href);
const { redesSociales } = await import(pathToFileURL(path.join(web, 'src/data/redes.ts')).href);

const IMAGEN = /\.(webp|jpe?g)$/i;
// Las versiones «-mobile» y «Mobile» son para el teléfono: en una pantalla grande va la de escritorio.
const MOVIL = /(-mobile|Mobile)\./;
const VIDEO = /\.(webm|mp4)$/i;

/**
 * **Solo fotos que aguantan una pantalla grande**: las de `Niveles/` son de 800 px y se rompen en grande; hay polaroids
 * de 366 px. Una foto cuyo lado mayor no llega a `LADO_MINIMO` no entra. `ffprobe` lee la medida de un webp igual que
 * la de un video. De paso se anota si es **vertical**: la versión del tótem (pantalla 9:16) las prefiere.
 */
const LADO_MINIMO = 1000;
const verticales = new Set();
const medida = (ruta) => {
  const s = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', ruta],
    { encoding: 'utf8' },
  );
  const [ancho, alto] = s.trim().split('\n')[0].split(',').map(Number);
  return { ancho, alto };
};

/** Los archivos de una carpeta de `public/media`, como ruta pública (`/media/…`), ordenados por nombre. */
function archivos(carpeta, filtro) {
  const dir = path.join(media, carpeta);
  let nombres = [];
  try {
    nombres = readdirSync(dir);
  } catch {
    return [];
  }
  return nombres
    .filter((n) => filtro.test(n) && !MOVIL.test(n) && statSync(path.join(dir, n)).isFile())
    .filter((n) => {
      if (filtro !== IMAGEN) return true;
      const { ancho, alto } = medida(path.join(dir, n));
      if (Math.max(ancho, alto) < LADO_MINIMO) return false;
      if (alto > ancho) verticales.add(`/media/${carpeta}/${n}`);
      return true;
    })
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((n) => `/media/${carpeta}/${n}`);
}

/** Un video con lo que dura: la versión larga lo pasa entero. Se mide aquí, una vez. */
const conDuracion = (ruta) => {
  const s = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(web, 'public', ruta)],
    { encoding: 'utf8' },
  );
  return { src: ruta, segundos: Math.ceil(Number(s)) };
};

// Los videos de una carpeta; si el mismo está en webm y mp4, el webm (pesa menos).
const videos = (carpeta) => {
  const v = archivos(carpeta, VIDEO);
  const sinExtension = (x) => x.replace(VIDEO, '');
  return v
    .filter((x) => x.endsWith('.webm') || !v.includes(`${sinExtension(x)}.webm`))
    .map(conDuracion);
};
const unVideo = (carpeta) => videos(carpeta)[0] ?? null;

/**
 * **La versión vertical del video de una carpeta** (dev, 2026-11-23: «tengo clips especiales para pantallas verticales;
 * si están mejor, ponemos esos»): la web los tiene para el teléfono (`heroVert`, `FPHeroMobile`, `SFLHeroMobile`, de 4:5 o
 * cuadrados). En el tótem llenan mucho más que uno de 21:9. Se elige el más alto que ancho (o cuadrado) de mayor
 * resolución; si el mismo está en webm y mp4, el webm. Sin uno así, `null` y el tótem usa el horizontal.
 *
 * **Manda `public/media/vitrina/<clave>.mp4`** si existe: el mismo clip a 1080 × 1350 sacado del original (los de la web
 * son de 720 × 900, para el teléfono, y un tótem de 43–55" mide 1080 de ancho). Van en su carpeta porque el sitio elige
 * los videos de `Hero/` y de `hero/` por nombre: uno más ahí podía colarse en la portada. Se hacen así (sin audio: la
 * vitrina va muda):
 *   ffmpeg -i "<original 4_5>.mp4" -an -vf "scale=1080:1350:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow \
 *     -crf 25 -profile:v high -movflags +faststart public/media/vitrina/<clave>.mp4
 */
const unVideoVertical = (carpeta, clave) => {
  try {
    statSync(path.join(media, 'vitrina', `${clave}.mp4`));
    return conDuracion(`/media/vitrina/${clave}.mp4`);
  } catch {
    // Sin versión propia para el tótem: la vertical de la web, si hay.
  }
  const dir = path.join(media, carpeta);
  let nombres = [];
  try {
    nombres = readdirSync(dir).filter((n) => VIDEO.test(n));
  } catch {
    return null;
  }
  const altos = nombres
    .map((n) => ({ n, ...medida(path.join(dir, n)) }))
    .filter((v) => v.alto >= v.ancho)
    .sort((a, b) => b.alto * b.ancho - a.alto * a.ancho || (b.n.endsWith('.webm') ? 1 : 0) - (a.n.endsWith('.webm') ? 1 : 0));
  return altos.length ? conDuracion(`/media/${carpeta}/${altos[0].n}`) : null;
};
/** Un póster vertical (el de teléfono): la primera imagen más alta que ancha, sin pedirle tamaño (va desenfocado). */
const unPosterVertical = (carpeta) => {
  try {
    const n = readdirSync(path.join(media, carpeta)).find((x) => {
      if (!IMAGEN.test(x)) return false;
      const { ancho, alto } = medida(path.join(media, carpeta, x));
      return alto > ancho;
    });
    return n ? `/media/${carpeta}/${n}` : null;
  } catch {
    return null;
  }
};

/** «@garden.launion» desde la URL de la red (como en `/enlaces`); Facebook no trae usuario en su URL. */
function usuarioDe(url) {
  const segmentos = new URL(url).pathname.split('/').filter(Boolean);
  if (segmentos.length === 1) return segmentos[0].startsWith('@') ? segmentos[0] : `@${segmentos[0]}`;
  return (
    segmentos.find((x) => x.startsWith('@')) ??
    (segmentos[0] === 'people' && segmentos[1] ? decodeURIComponent(segmentos[1]).replaceAll('-', ' ') : null)
  );
}
const NOMBRES = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube' };

const parrafos = (texto) =>
  texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const sitio = (process.env.SITE_URL || 'https://gardenlaunion.cl').replace(/\/$/, '');
const ENLACES = '/enlaces';

const datos = {
  generado: new Date().toISOString().slice(0, 10),
  sitio: sitio.replace(/^https?:\/\//, '') + ENLACES,
  // El QR lleva a la página de enlaces (redes, admisión, contacto), no a la portada. Corrección alta (H): el león al
  // centro tapa menos del 30 % que aguanta.
  qr: await QRCode.toString(sitio + ENLACES, { type: 'svg', margin: 0, errorCorrectionLevel: 'H' }),
  colegio: {
    nombre: c['institucional.nombre'],
    slogan: c['institucional.slogan'],
    ciudad: c['institucional.ciudad'],
    mision: c['institucional.mision'],
    vision: c['institucional.vision'],
    resena: c['institucional.resena'],
  },
  sedes: ['sede_basica', 'sede_media'].map((s) => ({
    nombre: c[`contacto.${s}.nombre`],
    direccion: c[`contacto.${s}.direccion`],
    niveles: c[`contacto.${s}.niveles`],
  })),
  sellos: {
    titulo: c['sellos.titulo'],
    descripcion: c['sellos.descripcion'],
    cifra: c['sellos.cta'].cifra,
    cifraTexto: c['sellos.cta'].texto,
    tarjetas: c['sellos.cards'].map(({ titulo, descripcion, icono }) => ({ titulo, descripcion, icono })),
  },
  // Sin las fotos de `Niveles/` (800 px): el mosaico de cada nivel lo arma `guion.js` con fotos grandes elegidas a mano.
  niveles: c['niveles.info'],
  extras: c['niveles.extras'],
  admision: { info: c['admision.info'] },
  // Las mismas del Footer; una red sin URL real (WhatsApp mientras sea un placeholder) no entra.
  redes: Object.entries(NOMBRES).flatMap(([red, nombre]) => {
    const url = redesSociales[red];
    return url?.startsWith('https://') ? [{ red, nombre, usuario: usuarioDe(url) }] : [];
  }),
  medios: {
    logo: '/media/Logo/gc-identidad-uniforme.webp',
    escudo: '/media/Logo/leon-circulo.webp',
    // El mismo escudo en 512 px, para la portada en pantalla grande (el de 220 px se ve borroso a ese tamaño).
    escudoGrande: '/media/Logo/cropped-cropped-logo.png',
    hero: {
      video: unVideo('Hero'),
      poster: '/media/Hero/posterDesktop.webp',
      videoVertical: unVideoVertical('Hero', 'hero'),
      posterVertical: unPosterVertical('Hero'),
    },
    quienesSomos: archivos('QuienesSomos/polaroid', IMAGEN),
    convivencia: archivos('carousel-cards/convivencia', IMAGEN),
    galeria: archivos('Galeria', IMAGEN),
    admision: archivos('Admision', IMAGEN),
  },
  eventos: eventos
    .filter((e) => e.publicado)
    .map((e) => {
      const base = `eventos/${e.slug}`;
      const anios = readdirSync(path.join(media, base))
        .filter((d) => /^\d{4}$/.test(d))
        .sort()
        .reverse();
      return {
        slug: e.slug,
        nombre: e.nombre,
        titulo: e.titulo,
        extracto: e.extracto,
        fecha: e.fecha,
        parrafos: parrafos(e.texto),
        video: unVideo(`${base}/hero`),
        videoVertical: unVideoVertical(`${base}/hero`, e.slug),
        portada: archivos(`${base}/hero`, IMAGEN)[0] ?? null,
        polaroid: archivos(`${base}/polaroid`, IMAGEN),
        galerias: anios.map((anio) => ({
          anio,
          fotos: archivos(`${base}/${anio}`, IMAGEN),
          videos: videos(`${base}/${anio}`),
        })),
      };
    }),
};
datos.verticales = [...verticales].sort();

const destino = path.join(web, 'src', 'lib', 'vitrina', 'contenido.json');
writeFileSync(destino, `${JSON.stringify(datos, null, 2)}\n`);
console.log(
  `Listo: ${path.relative(process.cwd(), destino)} (${datos.eventos.length} eventos, ${datos.verticales.length} fotos verticales)`,
);
