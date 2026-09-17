import fs from "fs";
import path from "path";
import sharp from "sharp";
import { eventos } from "@/content/eventos";
import { getMediaImages, getMediaVideos, getMediaPhotos, altDesdeArchivo } from "@/lib/media";
import type { FotoColumnas } from "@/components/public/shared/GaleriaColumnas";

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

/**
 * Distancia en días entre hoy y la ocurrencia más cercana del mes/día de
 * `fecha` — sin importar el año que tenga escrito (los eventos son anuales,
 * recurrentes). Prueba el año pasado, este año y el próximo, y se queda con
 * la más chica: así un 18 de septiembre a dos días se ve tan "cerca" como un
 * 20 de abril recién pasado hace dos días, sin importar en qué mes estemos.
 */
function diasHastaOcurrenciaMasCercana(fecha: string, hoy: Date): number {
  const [, mesStr, diaStr] = fecha.split("-");
  const mes = Number(mesStr) - 1;
  const dia = Number(diaStr);
  const anioHoy = hoy.getFullYear();
  const msPorDia = 24 * 60 * 60 * 1000;

  return Math.min(
    ...[anioHoy - 1, anioHoy, anioHoy + 1].map((anio) =>
      Math.abs(new Date(anio, mes, dia).getTime() - hoy.getTime()) / msPorDia
    )
  );
}

/**
 * El destacado (hero grande de Historias): el evento publicado cuya fecha
 * anual está más cerca de hoy, recién pasada o por venir. Rota solo con el
 * calendario — no hay flag que alguien tenga que acordarse de mover, y
 * ningún evento se queda pegado como hero todo el año.
 */
export function getEventoDestacado(): Evento | null {
  const publicados = getEventosPublicados();
  if (publicados.length === 0) return null;

  const hoy = new Date();
  return publicados.reduce((masCercano, actual) =>
    diasHastaOcurrenciaMasCercana(actual.fecha, hoy) <
    diasHastaOcurrenciaMasCercana(masCercano.fecha, hoy)
      ? actual
      : masCercano
  );
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

  // Convención: el archivo con "mobile" en el nombre es el clip vertical/cuadrado
  // de móvil; el resto es el apaisado de desktop. Sin uno dedicado de móvil, cae
  // al de desktop (object-cover recorta).
  const heroVideosEvento = getMediaVideos(`${base}/hero`);
  const heroVideoDesktop = heroVideosEvento.find((v) => !/mobile/i.test(v)) ?? null;
  const heroVideoMobile =
    heroVideosEvento.find((v) => /mobile/i.test(v)) ?? heroVideoDesktop;

  return {
    anio,
    /** Video permanente de portada, apaisado (carpeta hero/). */
    heroVideo: heroVideoDesktop,
    /** Video de portada para móvil portrait (archivo con "mobile"). */
    heroVideoMobile,
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

const IMAGE_EXTS_GALERIA = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function getFotosConDimensiones(
  mediaBase: string,
  altPorDefecto: string
): Promise<FotoColumnas[]> {
  const dir = path.join(process.cwd(), "public", "media", mediaBase);
  if (!fs.existsSync(dir)) return [];

  const archivos = fs
    .readdirSync(dir)
    .filter((f) => {
      const full = path.join(dir, f);
      return fs.statSync(full).isFile() && IMAGE_EXTS_GALERIA.has(path.extname(f).toLowerCase());
    })
    .sort();

  if (archivos.length === 0) return [];

  return Promise.all(
    archivos.map(async (archivo) => {
      const alt = altDesdeArchivo(archivo, altPorDefecto);
      const src = `/media/${mediaBase}/${encodeURIComponent(archivo)}`;
      try {
        const meta = await sharp(path.join(dir, archivo)).metadata();
        return { src, width: meta.width ?? 1200, height: meta.height ?? 800, alt };
      } catch {
        return { src, width: 1200, height: 800, alt };
      }
    })
  );
}

/**
 * Fotos y videos de UNA edición (año) puntual de un evento, listos para
 * GaleriaColumnas. Agrupa .mp4/.webm/.mov del mismo clip en un solo item,
 * empareja el poster (mismo nombre base) y la versión móvil liviana
 * ("<stem>-mobile.mp4"). Se usa tanto para la edición activa como para las
 * anteriores — ver getGaleriaEdiciones.
 */
export async function getGaleriaEdicion(
  slug: string,
  anio: number,
  altEvento: string
): Promise<FotoColumnas[]> {
  const mediaBase = `eventos/${slug}/${anio}`;
  const videoDir = path.join(process.cwd(), "public", "media", mediaBase);

  const fotos = await getFotosConDimensiones(mediaBase, altEvento);

  // Agrupa por "stem" (nombre sin extensión) para que .mp4 + .webm del mismo
  // clip sean un solo item con varias fuentes. Los "<stem>-mobile.mp4" NO se
  // listan aparte: son la versión liviana que se empareja y sirve solo en celular.
  const videosByStem = new Map<string, string[]>();
  getMediaVideos(mediaBase).forEach((src) => {
    const stem = path.basename(src, path.extname(src));
    if (/-mobile$/i.test(stem)) return;
    videosByStem.set(stem, [...(videosByStem.get(stem) ?? []), src]);
  });

  // width/height son placeholder 16:9 — GaleriaColumnas sondea las dimensiones reales del archivo
  const videoItems: FotoColumnas[] = Array.from(videosByStem.entries()).map(([stem, srcs]) => {
    const posterExt = [".jpg", ".webp", ".jpeg", ".png"].find((ext) =>
      fs.existsSync(path.join(videoDir, `${stem}${ext}`))
    );
    // MP4 primero: iOS usa el decoder H.264 de hardware; WebM después: VP9 para desktop
    const sources: { src: string; type: string }[] = [
      ...(srcs.some((s) => s.endsWith(".mp4"))  ? [{ src: `/media/${mediaBase}/${stem}.mp4`,  type: "video/mp4"       }] : []),
      ...(srcs.some((s) => s.endsWith(".webm")) ? [{ src: `/media/${mediaBase}/${stem}.webm`, type: "video/webm"      }] : []),
      ...(srcs.some((s) => s.endsWith(".mov"))  ? [{ src: `/media/${mediaBase}/${stem}.mov`,  type: "video/quicktime" }] : []),
    ];
    if (!posterExt) {
      console.warn(`[eventos/${slug}] Video sin poster en ${anio}: "${stem}" — agrega una imagen con el mismo nombre (ej: ${stem}.webp)`);
    }
    const sourcesMobile = fs.existsSync(path.join(videoDir, `${stem}-mobile.mp4`))
      ? [{ src: `/media/${mediaBase}/${stem}-mobile.mp4`, type: "video/mp4" }]
      : undefined;
    return {
      src: srcs[0],
      width: 16,
      height: 9,
      alt: altDesdeArchivo(stem, `Video de ${altEvento}`),
      ...(posterExt && { poster: `/media/${mediaBase}/${stem}${posterExt}` }),
      sources,
      ...(sourcesMobile && { sourcesMobile }),
    };
  });

  // Excluye los posters de la tira de fotos — ya se muestran como thumbnail del video
  const videoPosterUrls = new Set(videoItems.map((v) => v.poster).filter(Boolean) as string[]);
  return [
    ...videoItems,
    ...fotos.filter((f) => !videoPosterUrls.has(f.src)),
  ];
}

/** Todas las ediciones (años) de un evento, cada una con su galería resuelta. */
export async function getGaleriaEdiciones(
  slug: string,
  altPorAnio: (anio: number) => string
): Promise<{ anio: number; fotos: FotoColumnas[] }[]> {
  const anios = getAniosEvento(slug);
  return Promise.all(
    anios.map(async (anio) => ({
      anio,
      fotos: await getGaleriaEdicion(slug, anio, altPorAnio(anio)),
    }))
  );
}
