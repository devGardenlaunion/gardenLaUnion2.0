import fs from "fs";
import path from "path";
import sharp from "sharp";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { getMediaImages, getMediaVideos } from "@/lib/media";
import Navbar from "@/components/public/sections/Navbar";
import Footer from "@/components/public/sections/Footer";
import GaleriaPolaroid, { type FotoPolaroid } from "@/components/public/shared/GaleriaPolaroid";
import GaleriaColumnas, { type FotoColumnas } from "@/components/public/shared/GaleriaColumnas";
import AutoplayVideo from "@/components/public/shared/AutoplayVideo";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function getFotosGrande(mediaBase: string): Promise<FotoColumnas[]> {
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
      const nombre = path.basename(archivo, path.extname(archivo));
      try {
        const meta = await sharp(path.join(dir, archivo)).metadata();
        return {
          src: `/media/${mediaBase}/${archivo}`,
          width: meta.width ?? 1200,
          height: meta.height ?? 800,
          alt: nombre.replace(/[-_]/g, " "),
        };
      } catch {
        return { src: `/media/${mediaBase}/${archivo}`, width: 1200, height: 800, alt: nombre.replace(/[-_]/g, " ") };
      }
    })
  );
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEdicion(slug: string) {
  return prisma.edicion.findUnique({
    where: { slug },
    include: {
      evento: {
        include: {
          ediciones: {
            where: { estado: "PUBLICADA" },
            orderBy: { fecha: "desc" },
            select: { id: true, titulo: true, slug: true, fecha: true },
          },
        },
      },
      multimedia: { orderBy: { orden: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const edicion = await getEdicion(slug);
  if (!edicion || edicion.estado !== "PUBLICADA") return {};

  return {
    title: `${edicion.titulo} — Garden College`,
    description: edicion.extracto,
    openGraph: {
      title: edicion.titulo,
      description: edicion.extracto,
      type: "article",
      ...(edicion.imagenPortada && { images: [{ url: edicion.imagenPortada }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: edicion.titulo,
      description: edicion.extracto,
      ...(edicion.imagenPortada && { images: [edicion.imagenPortada] }),
    },
  };
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params;
  const [edicion, config] = await Promise.all([
    getEdicion(slug),
    getConfig(),
  ]);

  if (!edicion || edicion.estado !== "PUBLICADA") notFound();

  const nombre = config["institucional.nombre"] || "Garden College";
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

  const year = edicion.fecha.getFullYear();
  const eventBase = `eventos/${edicion.evento.slug}`;
  const mediaBase = `${eventBase}/${year}`;

  const fotosGrande = await getFotosGrande(mediaBase);
  const fotosDB = edicion.multimedia.filter((m) => m.tipo === "foto");
  const fotosCarpeta = getMediaImages(`${eventBase}/polaroid`);
  const urlsDB = new Set(fotosDB.map((f) => f.url));
  const fotosExtra = fotosCarpeta.filter((f) => !urlsDB.has(f.src));

  const VIDEO_URL_RE = /\.(mp4|webm|mov)$/i;
  const fotosPolaroidBase: FotoPolaroid[] = [
    ...fotosDB
      .filter((f) => !VIDEO_URL_RE.test(f.url))
      .map((f) => ({ src: f.url, caption: f.titulo || "" })),
    ...fotosExtra,
  ];
  // Si no hay fotos dedicadas al polaroid, usar las primeras 4 de la galería del año
  const fotosPolaroid: FotoPolaroid[] =
    fotosPolaroidBase.length > 0
      ? fotosPolaroidBase
      : fotosGrande.slice(0, 4).map((f) => ({ src: f.src, caption: f.alt }));

  // Hero: video permanente del evento > imagen BD > imagen carpeta año
  const heroVideo = getMediaVideos(`${eventBase}/hero`)[0] ?? null;
  const heroSrc = heroVideo
    ? null
    : (edicion.imagenPortada ?? getMediaImages(`${mediaBase}/hero`)[0]?.src ?? null);

  const videos = edicion.multimedia.filter((m) => m.tipo === "youtube");

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
      alt: "",
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

  const otrasEdiciones = edicion.evento.ediciones.filter(
    (e) => e.slug !== edicion.slug
  );

  const parrafos = edicion.evento.descripcion?.split("\n\n").filter(Boolean) ?? [];
  const introParrafos = parrafos.slice(0, 2);
  const cuerpoParrafos = parrafos.slice(2);

  return (
    <>
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
              alt={edicion.titulo}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          {/* Scrim superior — evita que el navbar se pierda en fondos claros */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          {/* Scrim inferior — garantiza legibilidad del texto siempre */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="relative container-gc pb-10 pt-14">
            <a href="/#eventos" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm font-body mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Eventos
            </a>
            <br />
            <span className="inline-flex items-center px-4 py-1.5 bg-gc-gold/20 text-gc-gold-light text-sm font-semibold rounded-full border border-gc-gold/20 mb-4">
              {edicion.evento.nombre} · {format(edicion.fecha, "yyyy", { locale: es })}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight max-w-4xl drop-shadow-lg">
              {edicion.titulo}
            </h1>
            <time className="text-white/70 text-sm font-body drop-shadow">
              {format(edicion.fecha, "d 'de' MMMM, yyyy", { locale: es })}
            </time>
          </div>
        </div>

        {/* Contenido */}
        <div className="container-gc py-10 lg:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Extracto */}
            <p className="text-xl text-gc-green-800/70 font-body leading-relaxed mb-8 border-l-4 border-gc-green pl-5">
              {edicion.extracto}
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

            {/* YouTube embeds */}
            {videos.length > 0 && (
              <div className="mb-10">
                <div className="grid gap-4">
                  {videos.map((video) => (
                    <div key={video.id} className="aspect-video rounded-xl overflow-hidden">
                      <iframe
                        src={video.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") + "?rel=0"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Galería — fotos y videos con márgenes normales de página */}
            {galeriaItems.length > 0 && (
              <div className="mb-10">
                <div className="border-l-4 border-gc-gold pl-4 mb-6">
                  <p className="text-xs font-body font-semibold text-gc-green-600 uppercase tracking-widest mb-1">
                    {edicion.evento.nombre} · {year}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gc-green-800">
                    Galería
                  </h2>
                </div>
                <GaleriaColumnas fotos={galeriaItems} />
              </div>
            )}

            {/* Otras ediciones */}
            {otrasEdiciones.length > 0 && (
              <div className="mb-10 p-6 bg-gc-cream rounded-2xl">
                <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-4">
                  Ediciones anteriores — {edicion.evento.nombre}
                </p>
                <div className="flex flex-wrap gap-2">
                  {otrasEdiciones.map((ed) => (
                    <a
                      key={ed.slug}
                      href={`/eventos/${ed.slug}`}
                      className="px-4 py-2 bg-white border border-gc-green-100 text-gc-green-800 text-sm font-body rounded-full hover:bg-gc-green hover:text-white hover:border-gc-green transition-colors"
                    >
                      {format(new Date(ed.fecha), "yyyy", { locale: es })} — {ed.titulo.substring(0, 35)}{ed.titulo.length > 35 ? "…" : ""}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Volver */}
            <a href="/#eventos" className="btn-secondary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Eventos
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
