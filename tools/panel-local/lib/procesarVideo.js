// Pipeline de video — ver docs/EVENTOS.md §5 y docs/admin/REQUISITOS.md.
// Usa los binarios de sistema ffmpeg/ffprobe (pacman -S ffmpeg) — esto solo
// corre local, no hace falta bundlear nada.

const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const EXTENSIONES_ACEPTADAS = new Set([".mp4", ".webm", ".mov"]);
const MAX_ENTRADA_BYTES = 300 * 1024 * 1024; // 300 MB, per REQUISITOS.md

function esVideoAceptado(nombreArchivo) {
  return EXTENSIONES_ACEPTADAS.has(path.extname(nombreArchivo).toLowerCase());
}

async function obtenerDuracionSegundos(rutaArchivo) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    rutaArchivo,
  ]);
  const duracion = parseFloat(stdout.trim());
  return Number.isFinite(duracion) ? duracion : 0;
}

/**
 * Procesa un buffer de video y devuelve un array de { buffer, nombreSalida }:
 * [ <base>.mp4 (desktop), <base>.jpg (poster), <base>-mobile.mp4 (480p) ].
 */
async function procesarVideo(bufferOriginal, nombreArchivo) {
  const ext = path.extname(nombreArchivo).toLowerCase();
  const base = path.basename(nombreArchivo, ext);

  if (!EXTENSIONES_ACEPTADAS.has(ext)) {
    throw new Error(`Extensión no soportada: "${ext}" (${nombreArchivo})`);
  }
  if (bufferOriginal.length > MAX_ENTRADA_BYTES) {
    throw new Error(
      `"${nombreArchivo}" pesa ${(bufferOriginal.length / 1024 / 1024).toFixed(1)} MB — máximo 300 MB de entrada.`
    );
  }

  const dirTemp = await fs.mkdtemp(path.join(os.tmpdir(), "panel-local-video-"));
  const entrada = path.join(dirTemp, `entrada${ext}`);
  const salidaDesktop = path.join(dirTemp, `${base}.mp4`);
  const salidaPoster = path.join(dirTemp, `${base}.jpg`);
  const salidaMobile = path.join(dirTemp, `${base}-mobile.mp4`);

  try {
    await fs.writeFile(entrada, bufferOriginal);

    // Desktop: sin audio, 24fps, scale=1280:-2 — comando probado en REQUISITOS.md.
    await execFileAsync("ffmpeg", [
      "-y", "-i", entrada,
      "-an", "-r", "24",
      "-vf", "scale=1280:-2",
      "-c:v", "libx264", "-crf", "32", "-preset", "slow",
      "-movflags", "+faststart",
      salidaDesktop,
    ]);

    // Poster a ~1/3 de duración — el segundo 1 suele salir en negro.
    const duracion = await obtenerDuracionSegundos(entrada);
    const tiempoPoster = Math.max(0.5, duracion / 3);
    await execFileAsync("ffmpeg", [
      "-y", "-ss", String(tiempoPoster), "-i", entrada,
      "-vframes", "1",
      salidaPoster,
    ]);

    // Variante móvil liviana 480p.
    await execFileAsync("ffmpeg", [
      "-y", "-i", entrada,
      "-an",
      "-vf", "scale=-2:480",
      "-c:v", "libx264", "-crf", "27",
      "-movflags", "+faststart",
      salidaMobile,
    ]);

    const [bufDesktop, bufPoster, bufMobile] = await Promise.all([
      fs.readFile(salidaDesktop),
      fs.readFile(salidaPoster),
      fs.readFile(salidaMobile),
    ]);

    return [
      { buffer: bufDesktop, nombreSalida: `${base}.mp4` },
      { buffer: bufPoster, nombreSalida: `${base}.jpg` },
      { buffer: bufMobile, nombreSalida: `${base}-mobile.mp4` },
    ];
  } finally {
    await fs.rm(dirTemp, { recursive: true, force: true });
  }
}

module.exports = { procesarVideo, esVideoAceptado, EXTENSIONES_ACEPTADAS };
