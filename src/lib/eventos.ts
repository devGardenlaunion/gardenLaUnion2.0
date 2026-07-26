import fs from "fs";
import path from "path";
import { eventos } from "@/content/eventos";
import { getMediaImages, getMediaVideos, getMediaPhotos } from "@/lib/media";

/**
 * Un evento del colegio. El texto vive en src/content/eventos.ts; las fotos y
 * videos viven en carpetas bajo public/media/eventos/<slug>/.
 *
 * Un evento es permanente (el texto no cambia año a año). Lo que cambia es la
 * GALERÍA: cada carpeta con nombre de año (2026, 2027…) es una "edición".
 */
export interface Evento {
  slug: string;
  nombre: string;
  /** Título de la edición — se muestra en el modal de la home. */
  titulo: string;
  /** Bajada corta: card de la home y blockquote de la subpágina. */
  extracto: string;
  /** Narrativa larga. Párrafos separados por línea en blanco. */
  texto: string;
  /** ISO (YYYY-MM-DD). Define el mes que se muestra y ordena los eventos. */
  fecha: string;
  /** El destacado es el hero grande de la sección Historias. Solo uno. */
  destacado: boolean;
  /** false = preparado pero invisible en el sitio. */
  publicado: boolean;
  /**
   * Qué galería mostrar al final de la subpágina. Si se omite, se usa el año
   * más reciente que exista como carpeta. Sirve para dejar fija una edición
   * mientras se prepara la del año nuevo.
   */
  edicionActiva?: number;
}

const RE_ANIO = /^\d{4}$/;

function dirEvento(slug: string): string {
  return path.join(process.cwd(), "public", "media", "eventos", slug);
}

/** Años con galería, detectados por las carpetas numéricas. Más reciente primero. */
export function getAniosEvento(slug: string): number[] {
  const dir = dirEvento(slug);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && RE_ANIO.test(d.name))
    .map((d) => Number(d.name))
    .sort((a, b) => b - a);
}

/** Año de la galería que se muestra: el declarado, o el más reciente que exista. */
export function getEdicionActiva(evento: Evento): number | null {
  const anios = getAniosEvento(evento.slug);
  if (anios.length === 0) return null;
  if (evento.edicionActiva && anios.includes(evento.edicionActiva)) {
    return evento.edicionActiva;
  }
  return anios[0];
}

/** Todos los publicados, del más nuevo al más viejo. */
export function getEventosPublicados(): Evento[] {
  return eventos
    .filter((e) => e.publicado)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

/** El destacado (hero de Historias). Si ninguno lo es, el más reciente. */
export function getEventoDestacado(): Evento | null {
  const publicados = getEventosPublicados();
  return publicados.find((e) => e.destacado) ?? publicados[0] ?? null;
}

/** Publicados menos el destacado — alimentan el grid de tarjetas. */
export function getEventosGrid(): Evento[] {
  const destacado = getEventoDestacado();
  return getEventosPublicados().filter((e) => e.slug !== destacado?.slug);
}

export function getEvento(slug: string): Evento | null {
  return eventos.find((e) => e.slug === slug && e.publicado) ?? null;
}

/** Media de un evento, toda desde el filesystem. */
export function getMediaEvento(evento: Evento) {
  const base = `eventos/${evento.slug}`;
  const anio = getEdicionActiva(evento);

  return {
    anio,
    /** Video permanente de portada (carpeta hero/). */
    heroVideo: getMediaVideos(`${base}/hero`)[0] ?? null,
    /** Imagen de portada: hero/ del año, si no la primera de hero/. */
    portada:
      (anio ? getMediaImages(`${base}/${anio}/hero`)[0]?.src : undefined) ??
      getMediaImages(`${base}/hero`)[0]?.src ??
      null,
    /** Fotos del bloque polaroid. */
    polaroid: getMediaImages(`${base}/polaroid`),
    /** Galería grande del año activo (sin posters de video). */
    galeria: anio ? getMediaPhotos(`${base}/${anio}`) : [],
    /** Videos del año activo. */
    videos: anio ? getMediaVideos(`${base}/${anio}`) : [],
    /** Años con galería disponibles. */
    anios: getAniosEvento(evento.slug),
  };
}

/** Párrafos de la narrativa, listos para renderizar. */
export function getParrafos(evento: Evento): string[] {
  return evento.texto
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}
