/**
 * Utilidad server-side para leer archivos desde public/media/<Seccion>/
 * Solo se puede llamar desde Server Components o funciones de servidor (no "use client").
 */

import fs from "fs";
import path from "path";

const IMAGE_EXTS  = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTS  = new Set([".mp4", ".webm", ".mov"]);

/**
 * Señales inequívocas de un volcado de cámara, WhatsApp, Instagram o iOS. Si
 * alguna aparece, el nombre completo se descarta: da igual qué más traiga, no
 * fue escrito por una persona para describir la foto.
 */
const MARCAS_DE_VOLCADO: RegExp[] = [
  /whatsapp/i,
  /screenshot|captura[\s_-]?de[\s_-]?pantalla/i,
  /unknown/i,
  /\b(img|dsc|dscn|pxl|vid|mvimg|photo|foto)[\s_-]?\d/i,
  /\d{6,}/,                       // 40521008_… , 17995253282935891_…
  /\b[0-9a-f]{8}-[0-9a-f]{4}-/i,  // UUID que pone iOS al exportar
];

/** Sufijos que agregan compresores y editores de video, sin valor descriptivo. */
const SUFIJOS_DE_HERRAMIENTA =
  /[\s_-]*\b(resultado|copia|copy|final|edit|min|compressed|v\d+|lofi|vlog|music|audio|sound|track|beat|pulsebox)\b/gi;

/** Relación de aspecto en el nombre: "(16-9)", "(21:9)". */
const RELACION_DE_ASPECTO = /\s*\(\s*\d{1,2}\s*[-:.]\s*\d{1,2}\s*\)\s*/g;

/**
 * Texto alternativo de una imagen a partir de su nombre de archivo.
 *
 * Si el nombre describe algo ("desfile-fomento-lector" → "Desfile fomento
 * lector") se usa. Si es un volcado de cámara ("IMG_0213",
 * "40521008_Unknown_resultado", "WhatsApp Image 2026-03-23 at 5.17.51 PM") se
 * descarta y se devuelve `contexto`.
 *
 * Importa: el alt es lo que indexa Google Imágenes y lo que escucha quien usa
 * lector de pantalla. "IMG 0213" no es texto alternativo, es ruido.
 */
export function altDesdeArchivo(archivo: string, contexto: string): string {
  const base = path.basename(archivo, path.extname(archivo));

  if (MARCAS_DE_VOLCADO.some((re) => re.test(base))) return contexto;

  const limpio = base
    .replace(RELACION_DE_ASPECTO, " ")
    // Los separadores se normalizan ANTES de quitar sufijos: "_" es carácter de
    // palabra, así que `\b` no reconoce el límite en "_resultado" y el sufijo
    // sobreviviría.
    .replace(/[-_]+/g, " ")
    .replace(SUFIJOS_DE_HERRAMIENTA, " ")
    // "LocuraDeViernesLector" → "Locura De Viernes Lector". Sólo corta en
    // minúscula→mayúscula, así "SFL" y demás siglas quedan enteras.
    .replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, "$1 $2")
    .replace(/([a-záéíóúüñ])(\d)/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  // Sin ninguna palabra de 3+ letras no queda nada que leer en voz alta.
  const tienePalabras = limpio
    .split(" ")
    .some((p) => /^[a-záéíóúüñ]{3,}$/i.test(p));

  if (!tienePalabras) return contexto;

  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}


function mediaDir(section: string): string {
  return path.join(process.cwd(), "public", "media", section);
}

/**
 * Devuelve todas las imágenes de public/media/<section>/ ordenadas por nombre.
 *
 * `contexto` es el texto alternativo de respaldo para los archivos cuyo nombre
 * no describe nada (ver altDesdeArchivo). Se usa como `alt`, nunca se muestra:
 * sin él las galerías salen con alt vacío y son invisibles para Google Imágenes
 * y para los lectores de pantalla.
 */
export function getMediaImages(
  section: string,
  contexto = ""
): { src: string; caption: string }[] {
  const dir = mediaDir(section);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({
      src: `/media/${section}/${encodeURIComponent(f)}`,
      caption: contexto ? altDesdeArchivo(f, contexto) : "",
    }));
}

/**
 * Igual que getMediaImages, pero descarta las imágenes que son thumbnail de un
 * video del mismo directorio.
 *
 * La convención de galerías (ver docs/admin/GALERIAS.md) es que un video lleva
 * su poster con el mismo nombre base: `Sombrero.mp4` + `Sombrero.webp`. Ese
 * poster es un frame del video, no una foto — si se cuela en una tira de fotos
 * el visitante ve un fotograma congelado sin saber que hay un video detrás.
 */
export function getMediaPhotos(
  section: string,
  contexto = ""
): { src: string; caption: string }[] {
  const dir = mediaDir(section);
  if (!fs.existsSync(dir)) return [];

  const archivos = fs.readdirSync(dir);

  const basesDeVideo = new Set(
    archivos
      .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
      .map((f) => path.basename(f, path.extname(f)))
  );

  return archivos
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .filter((f) => !basesDeVideo.has(path.basename(f, path.extname(f))))
    .sort()
    .map((f) => ({
      src: `/media/${section}/${encodeURIComponent(f)}`,
      caption: contexto ? altDesdeArchivo(f, contexto) : "",
    }));
}

/** Devuelve todos los videos de public/media/<section>/ ordenados por nombre. */
export function getMediaVideos(section: string): string[] {
  const dir = mediaDir(section);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => `/media/${section}/${f}`);
}

/**
 * Devuelve la primera imagen de public/media/<section>/, o undefined si no hay.
 * Útil para secciones con una sola imagen de portada (Admision, etc.).
 */
export function getMediaCover(section: string): string | undefined {
  return getMediaImages(section)[0]?.src;
}

/**
 * Devuelve un mapa { stem → src } con todas las imágenes de public/media/<section>/.
 * El stem es el nombre del archivo sin extensión (e.g. "nivel-basica" → "/media/Niveles/nivel-basica.webp").
 */
export function getMediaImageMap(section: string): Record<string, string> {
  const dir = mediaDir(section);
  if (!fs.existsSync(dir)) return {};

  const map: Record<string, string> = {};
  fs.readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .forEach((f) => {
      const stem = path.basename(f, path.extname(f));
      map[stem] = `/media/${section}/${f}`;
    });
  return map;
}
