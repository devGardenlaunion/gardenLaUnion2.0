import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getConfig } from "@/lib/config";
import { getMediaImages, getMediaVideos } from "@/lib/media";
import { absUrl, OG_IMAGE, jsonLdBreadcrumb } from "@/lib/seo";
import {
  getEvento,
  getEventosPublicados,
  getEdicionActiva,
  getMediaEvento,
  getGaleriaEdiciones,
  getParrafos,
} from "@/lib/eventos";
import JsonLd from "@/components/public/shared/JsonLd";
import Navbar from "@/components/public/sections/Navbar";
import Footer from "@/components/public/sections/Footer";
import GaleriaPolaroid, { type FotoPolaroid } from "@/components/public/shared/GaleriaPolaroid";
import GaleriaEdiciones from "@/components/public/shared/GaleriaEdiciones";
import AutoplayVideo from "@/components/public/shared/AutoplayVideo";

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

  // Una galería resuelta por cada año con carpeta — la activa se ve al entrar,
  // las anteriores quedan detrás del selector dentro de GaleriaEdiciones.
  const ediciones = await getGaleriaEdiciones(
    evento.slug,
    (anio) => `${evento.nombre} ${anio} en ${nombre}${ciudad ? `, ${ciudad}` : ""}`
  );
  const fotosGrande = ediciones.find((e) => e.anio === year)?.fotos ?? [];

  const fotosPolaroidBase: FotoPolaroid[] = getMediaImages(
    `${eventBase}/polaroid`,
    altEvento
  );
  // Si no hay fotos dedicadas al polaroid, usar las primeras 4 de la galería del año
  const fotosPolaroid: FotoPolaroid[] =
    fotosPolaroidBase.length > 0
      ? fotosPolaroidBase
      : fotosGrande.slice(0, 4).map((f) => ({ src: f.src, caption: f.alt }));

  // Hero: video permanente del evento > imagen BD > imagen carpeta año.
  // Convención: el archivo con "mobile" en el nombre es el clip vertical/cuadrado
  // de móvil; el resto es el apaisado de desktop. Si no hay uno dedicado de
  // móvil, cae al de desktop (object-cover recorta).
  const heroVideosEvento = getMediaVideos(`${eventBase}/hero`);
  const heroVideo = heroVideosEvento.find((v) => !/mobile/i.test(v)) ?? null;
  const heroVideoMobile =
    heroVideosEvento.find((v) => /mobile/i.test(v)) ?? heroVideo;
  const heroSrc = (heroVideo || heroVideoMobile)
    ? null
    : (getMediaImages(`${mediaBase}/hero`)[0]?.src ??
       getMediaImages(`${eventBase}/hero`)[0]?.src ??
       null);

  const parrafos = getParrafos(evento);
  const introParrafos = parrafos.slice(0, 2);
  const cuerpoParrafos = parrafos.slice(2);

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
          {heroVideo && (
            <AutoplayVideo
              src={heroVideo}
              className="absolute inset-0 w-full h-full object-cover hidden landscape:block md:block"
            />
          )}
          {heroVideoMobile && (
            <AutoplayVideo
              src={heroVideoMobile}
              className="absolute inset-0 w-full h-full object-cover block landscape:hidden md:hidden"
            />
          )}
          {!heroVideo && !heroVideoMobile && heroSrc && (
            <img
              src={heroSrc}
              alt={evento.nombre}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
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

            {/* Texto cuerpo + galería polaroid.
                Desktop: 2 columnas (texto | polaroid sticky) para leer con
                descanso al lado. Móvil: una columna, pero la polaroid va
                ENTREMEDIO del texto (no al final) para cortar el textwall.
                Se logra con un solo DOM: mitad1 → polaroid → mitad2, y en
                desktop el grid recoloca ambas mitades en la columna izquierda
                y la polaroid en la derecha abarcando las dos filas. */}
            {(cuerpoParrafos.length > 0 || fotosPolaroid.length > 0) && (
              fotosPolaroid.length > 0 ? (
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-14 lg:gap-y-5 lg:items-start mb-14">
                  <div className="space-y-5 lg:col-start-1 lg:row-start-1">
                    {cuerpoParrafos
                      .slice(0, Math.ceil(cuerpoParrafos.length / 2))
                      .map((p, i) => (
                        <p key={i} className="text-gc-green-800/80 font-body leading-relaxed">
                          {p}
                        </p>
                      ))}
                  </div>
                  <div className="relative z-20 my-8 lg:my-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:pl-4">
                    <GaleriaPolaroid fotos={fotosPolaroid} lightboxMode="inline" desorden={0.5} />
                  </div>
                  {cuerpoParrafos.length > 1 && (
                    <div className="space-y-5 lg:col-start-1 lg:row-start-2">
                      {cuerpoParrafos
                        .slice(Math.ceil(cuerpoParrafos.length / 2))
                        .map((p, i) => (
                          <p key={i} className="text-gc-green-800/80 font-body leading-relaxed">
                            {p}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 mb-14">
                  {cuerpoParrafos.map((p, i) => (
                    <p key={i} className="text-gc-green-800/80 font-body leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              )
            )}

            {/* Galería — fotos y videos, con selector de edición si hay más de un año */}
            <GaleriaEdiciones
              nombreEvento={evento.nombre}
              ediciones={ediciones}
              edicionActiva={year}
            />

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
