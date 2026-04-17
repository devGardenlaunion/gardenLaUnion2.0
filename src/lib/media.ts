/**
 * Utilidad server-side para leer archivos desde public/media/<Seccion>/
 * Solo se puede llamar desde Server Components o funciones de servidor (no "use client").
 */

import fs from "fs";
import path from "path";

const IMAGE_EXTS  = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTS  = new Set([".mp4", ".webm", ".mov"]);


function mediaDir(section: string): string {
  return path.join(process.cwd(), "public", "media", section);
}

/** Devuelve todas las imágenes de public/media/<section>/ ordenadas por nombre. */
export function getMediaImages(
  section: string
): { src: string; caption: string }[] {
  const dir = mediaDir(section);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({
      src: `/media/${section}/${f}`,
      caption: "",
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
