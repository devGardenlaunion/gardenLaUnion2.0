import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getConfig } from "@/lib/config";
import { altDesdeArchivo, getMediaImages, getMediaVideos } from "@/lib/media";
import { absUrl, OG_IMAGE, jsonLdBreadcrumb } from "@/lib/seo";
import {
  getEvento,
  getEventosPublicados,
  getEdicionActiva,
  getAniosEvento,
  getMediaEvento,
  getParrafos,
} from "@/lib/eventos";
import JsonLd from "@/components/public/shared/JsonLd";
import Navbar from "@/components/public/sections/Navbar";
import Footer from "@/components/public/sections/Footer";
import GaleriaPolaroid, { type FotoPolaroid } from "@/components/public/shared/GaleriaPolaroid";
import GaleriaColumnas, { type FotoColumnas } from "@/components/public/shared/GaleriaColumnas";
import AutoplayVideo from "@/components/public/shared/AutoplayVideo";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function getFotosGrande(
  mediaBase: string,
  altPorDefecto: string
): Promise<FotoColumnas[]> {
  const dir = path.join(process.cwd(), "public", "media", mediaBase);
  if (!fs.existsSync(dir)) return [];

  const archivos = fs
    .readdirSync(dir)
    .filter((f) => {
      const full = path.join(dir, f);
      return fs.statSync(full).isFile() && IMAGE_EXTS.has(path.extname(f).toLowerCase());
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

interface Props {
  params: Promise<{ slug: string }>;
}

/** Prerenderiza una página por evento publicado — el sitio queda estático. */
export async function generateStaticParams() {
  return getEventosPublicados().map((e) => ({ slug: e.slug }));
}

/**
 * Sólo existen los slugs de generateStaticParams; cualquier otro es 404 directo
 * sin invocar la función. Además de ser lo correcto para SEO (nada de páginas
 * fantasma indexables), evita que un render en runtime intente leer
 * public/media/ con `fs` — carpeta que no viaja en el bundle serverless.
 */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = getEvento(slug);
  if (!evento) return {};

  const ruta = `/eventos/${evento.slug}`;
  // Para redes: la portada real del evento; si no hay, la imagen del sitio.
  const portada = getMediaEvento(evento).portada;
  const imagen = portada ? absUrl(portada) : absUrl(OG_IMAGE.url);

  return {
    title: evento.nombre,
    description: evento.extracto,
    alternates: { canonical: ruta },
    openGraph: {
      type: "article",
      url: ruta,
      title: `${evento.nombre} — Garden College La Unión`,
      description: evento.extracto,
      publishedTime: evento.fecha,
      images: [{ url: imagen, alt: evento.titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${evento.nombre} — Garden College La Unión`,
      description: evento.extracto,
      images: [imagen],
    },
  };
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params;
  const evento = getEvento(slug);
  if (!evento) notFound();

  const config = await getConfig();

  const nombre = config["institucional.nombre"] || "Garden College";
  const ciudad = config["institucional.ciudad"] || "";
  const sedes = [
    {
      nombre: config["contacto.sede_basica.nombre"] || "Sede Básica",
      direccion: config["contacto.sede_basica.direccion"] || "",
      telefono: config["contacto.sede_basica.telefono"] || "",
      niveles: config["contacto.sede_basica.niveles"] || "",
    },
    {
      nombre: config["contacto.sede_media.nombre"] || "Sede Media",
      direccion: config["contacto.sede_media.direccion"] || "",
      telefono: config["contacto.sede_media.telefono"] || "",
      niveles: config["contacto.sede_media.niveles"] || "",
    },
  ];

  // El año de la galería sale de las carpetas, no de la fecha del texto.
  const eventBase = `eventos/${evento.slug}`;
  const year = getEdicionActiva(evento) ?? new Date(evento.fecha).getFullYear();
  const mediaBase = `${eventBase}/${year}`;

  // Alt de respaldo para las fotos cuyo nombre de archivo no describe nada.
  const altEvento = `${evento.nombre} ${year} en ${nombre}${ciudad ? `, ${ciudad}` : ""}`;

  const fotosGrande = await getFotosGrande(mediaBase, altEvento);
  const fotosPolaroidBase: FotoPolaroid[] = getMediaImages(
    `${eventBase}/polaroid`,
    altEvento
  );
  // Si no hay fotos dedicadas al polaroid, usar las primeras 4 de la galería del año
  const fotosPolaroid: FotoPolaroid[] =
    fotosPolaroidBase.length > 0
      ? fotosPolaroidBase
      : fotosGrande.slice(0, 4).map((f) => ({ src: f.src, caption: f.alt }));

  // Hero: video permanente del evento > imagen BD > imagen carpeta año
  const heroVideo = getMediaVideos(`${eventBase}/hero`)[0] ?? null;
  const heroSrc = heroVideo
    ? null
    : (getMediaImages(`${mediaBase}/hero`)[0]?.src ??
       getMediaImages(`${eventBase}/hero`)[0]?.src ??
       null);

  // Videos locales mezclados en la galería — se ponen al inicio
  const videoDir = path.join(process.cwd(), "public", "media", mediaBase);

  // Group by stem so .mp4 + .webm of the same clip become one item with multiple sources
  const videosByStem = new Map<string, string[]>();
  getMediaVideos(mediaBase).forEach((src) => {
    const stem = path.basename(src, path.extname(src));
    videosByStem.set(stem, [...(videosByStem.get(stem) ?? []), src]);
  });

  // width/height son placeholder 16:9 — GaleriaColumnas sondea las dimensiones reales del archivo
  const videoItems: FotoColumnas[] = Array.from(videosByStem.entries()).map(([stem, srcs]) => {
    const posterExt = [".jpg", ".webp", ".jpeg", ".png"].find((ext) =>
      fs.existsSync(path.join(videoDir, `${stem}${ext}`))
    );
    // MP4 first: iOS uses hardware H.264 decoder; WebM second: VP9 for desktop
    const sources: { src: string; type: string }[] = [
      ...(srcs.some((s) => s.endsWith(".mp4"))  ? [{ src: `/media/${mediaBase}/${stem}.mp4`,  type: "video/mp4"       }] : []),
      ...(srcs.some((s) => s.endsWith(".webm")) ? [{ src: `/media/${mediaBase}/${stem}.webm`, type: "video/webm"      }] : []),
      ...(srcs.some((s) => s.endsWith(".mov"))  ? [{ src: `/media/${mediaBase}/${stem}.mov`,  type: "video/quicktime" }] : []),
    ];
    if (!posterExt) {
      console.warn(`[eventos/${slug}] Video sin poster: "${stem}" — agrega una imagen con el mismo nombre (ej: ${stem}.webp)`);
    }
    return {
      src: srcs[0],
      width: 16,
      height: 9,
      alt: altDesdeArchivo(stem, `Video de ${altEvento}`),
      ...(posterExt && { poster: `/media/${mediaBase}/${stem}${posterExt}` }),
      sources,
    };
  });
  // Exclude poster images from fotosGrande — they're already shown as video thumbnails
  const videoPosterUrls = new Set(videoItems.map((v) => v.poster).filter(Boolean) as string[]);
  const galeriaItems: FotoColumnas[] = [
    ...videoItems,
    ...fotosGrande.filter((f) => !videoPosterUrls.has(f.src)),
  ];

  const parrafos = getParrafos(evento);
  const introParrafos = parrafos.slice(0, 2);
  const cuerpoParrafos = parrafos.slice(2);

  // "Ediciones anteriores" = los otros años que tienen carpeta de galería.
  const otrosAnios = getAniosEvento(evento.slug).filter((a) => a !== year);


  return (
    <>
      {/* Migas: Google las muestra en el resultado en vez de la URL cruda. */}
      <JsonLd
        data={jsonLdBreadcrumb([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Historias", ruta: "/#eventos" },
          { nombre: evento.nombre, ruta: `/eventos/${evento.slug}` },
        ])}
      />

      <Navbar
        nombre={nombre}
        telefonoBasica={sedes[0]?.telefono}
        telefonoMedia={sedes[1]?.telefono}
        variant="solid"
      />

      <main className="pt-20 bg-gc-warm min-h-screen">
        {/* Hero del evento */}
        <div className="relative min-h-[50vh] flex items-end bg-gradient-to-br from-gc-green-900 via-gc-green-800 to-gc-green-800 overflow-hidden">
          {heroVideo ? (
            <AutoplayVideo
              src={heroVideo}
              className="absolute inset-0 w-full h-full object-cover hidden landscape:block md:block"
            />
          ) : heroSrc ? (
            <img
              src={heroSrc}
              alt={evento.nombre}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          {/* Tint uniforme sobre el video */}
          <div className="absolute inset-0 bg-gc-green-900/50" />
          {/* Gradiente inferior — oscurece la zona del texto */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,56,50,0.95) 0%, rgba(20,56,50,0.55) 40%, transparent 70%)" }} />
          <div className="relative container-gc w-full pb-10 pt-14">
            <div className="max-w-3xl mx-auto">
              <a href="/#eventos" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm font-body mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver a Historias
              </a>
              <br />
              <span className="inline-flex items-center px-4 py-1.5 bg-gc-gold/20 text-gc-gold-light text-sm font-semibold rounded-full border border-gc-gold/20 mb-4">
                {evento.nombre}
              </span>
              {/* El h1 usa `titulo` (descriptivo, con la edición) y no `nombre`,
                  que ya se lee en el badge de arriba. Repetir el mismo string
                  desperdiciaba el único h1 de la página. */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-2 leading-tight drop-shadow-lg">
                {evento.titulo}
              </h1>
              <p className="text-white/60 text-base font-body drop-shadow capitalize">
                {format(new Date(evento.fecha), "MMMM", { locale: es })}{nombre ? ` · ${nombre}` : ""}{ciudad ? ` · ${ciudad}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="container-gc py-10 lg:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Extracto */}
            <p className="text-xl text-gc-green-800/70 font-body leading-relaxed mb-8 border-l-4 border-gc-green pl-5">
              {evento.extracto}
            </p>

            {/* Texto intro — ancho completo */}
            {introParrafos.length > 0 && (
              <div className="mb-10 space-y-5">
                {introParrafos.map((p, i) => (
                  <p key={i} className="text-gc-green-800/80 font-body leading-relaxed text-lg">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Texto cuerpo + galería polaroid — 2 columnas */}
            {(cuerpoParrafos.length > 0 || fotosPolaroid.length > 0) && (
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start mb-14">
                <div className="space-y-5">
                  {cuerpoParrafos.map((p, i) => (
                    <p key={i} className="text-gc-green-800/80 font-body leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
                {fotosPolaroid.length > 0 && (
                  <div className="lg:sticky lg:top-24 pl-4">
                    <GaleriaPolaroid fotos={fotosPolaroid} lightboxMode="inline" desorden={0.5} />
                  </div>
                )}
              </div>
            )}

            {/* Galería — fotos y videos con márgenes normales de página */}
            {galeriaItems.length > 0 && (
              <div className="mb-10">
                <div className="border-l-4 border-gc-gold pl-4 mb-6">
                  <p className="text-xs font-body font-semibold text-gc-green-600 uppercase tracking-widest mb-1">
                    {evento.nombre}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gc-green-800">
                    Galería {year}
                  </h2>
                </div>
                <GaleriaColumnas fotos={galeriaItems} />
              </div>
            )}

            {/* Ediciones anteriores — otros años con galería */}
            {otrosAnios.length > 0 && (
              <div className="mb-10 p-6 bg-gc-cream rounded-2xl">
                <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-4">
                  Ediciones anteriores — {evento.nombre}
                </p>
                <div className="flex flex-wrap gap-2">
                  {otrosAnios.map((anio) => (
                    <span
                      key={anio}
                      className="px-4 py-2 bg-white border border-gc-green-100 text-gc-green-800/60 text-sm font-body rounded-full"
                    >
                      {anio}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Volver */}
            <a href="/#eventos" className="btn-secondary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Historias
            </a>
          </div>
        </div>
      </main>

      <Footer
        nombre={nombre}
        corporacion={config["institucional.corporacion"] || ""}
        redes={{
          facebook: config["redes.facebook"],
          instagram: config["redes.instagram"],
          youtube: config["redes.youtube"],
        }}
      />
    </>
  );
}
