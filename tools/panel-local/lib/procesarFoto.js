// Pipeline de fotos — ver docs/EVENTOS.md §5 y docs/admin/REQUISITOS.md.
// rotate (EXIF) -> resize 1600 max -> webp calidad 72. HEIC/HEIF pasan primero
// por heic-convert (WASM, sin depender de libheif del sistema).

const path = require("path");
const sharp = require("sharp");
const convertHeic = require("heic-convert");

const EXTENSIONES_ACEPTADAS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".dng",
]);

function esFotoAceptada(nombreArchivo) {
  return EXTENSIONES_ACEPTADAS.has(path.extname(nombreArchivo).toLowerCase());
}

/**
 * Procesa un buffer de foto y devuelve { buffer, nombreSalida }.
 * nombreSalida siempre termina en .webp — el nombre base se conserva.
 */
async function procesarFoto(bufferOriginal, nombreArchivo) {
  const ext = path.extname(nombreArchivo).toLowerCase();
  const base = path.basename(nombreArchivo, path.extname(nombreArchivo));

  if (!EXTENSIONES_ACEPTADAS.has(ext)) {
    throw new Error(`Extensión no soportada: "${ext}" (${nombreArchivo})`);
  }

  let entrada = bufferOriginal;

  if (ext === ".heic" || ext === ".heif") {
    // heic-convert no lee EXIF de orientación — sharp sí, una vez convertido a JPEG.
    entrada = await convertHeic({
      buffer: bufferOriginal,
      format: "JPEG",
      quality: 0.95,
    });
  }
  // .dng: se intenta directo con sharp más abajo. Si falla, el error sube tal
  // cual — es una limitación conocida de v1 (ver plan), no hay fallback a
  // ImageMagick.

  const salida = await sharp(entrada)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();

  return { buffer: salida, nombreSalida: `${base}.webp` };
}

module.exports = { procesarFoto, esFotoAceptada, EXTENSIONES_ACEPTADAS };
