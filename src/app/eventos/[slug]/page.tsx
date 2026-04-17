import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import Navbar from "@/components/public/sections/Navbar";
import Footer from "@/components/public/sections/Footer";

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

  const fotos = edicion.multimedia.filter((m) => m.tipo === "foto");
  const videos = edicion.multimedia.filter((m) => m.tipo === "youtube");
  const otrasEdiciones = edicion.evento.ediciones.filter(
    (e) => e.slug !== edicion.slug
  );

  return (
    <>
      <Navbar
        nombre={nombre}
        telefono={sedes.map((s) => s.telefono).join(" | ")}
        variant="solid"
      />

      <main className="pt-20 bg-gc-warm min-h-screen">
        {/* Hero del evento */}
        <div className="relative min-h-[50vh] flex items-end bg-gradient-to-br from-gc-green-900 via-gc-green-800 to-gc-green-800 overflow-hidden">
          {edicion.imagenPortada && (
            <img
              src={edicion.imagenPortada}
              alt={edicion.titulo}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gc-green-900/95 via-gc-green-900/50 to-transparent" />
          <div className="relative container-gc pb-10 pt-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/50 font-body mb-6">
              <a href="/" className="hover:text-white/80 transition-colors">Inicio</a>
              <span>/</span>
              <a href="/#eventos" className="hover:text-white/80 transition-colors">Eventos</a>
              <span>/</span>
              <span className="text-white/70 line-clamp-1">{edicion.evento.nombre}</span>
            </nav>
            <span className="inline-flex items-center px-3 py-1 bg-gc-gold/20 text-gc-gold-light text-xs font-semibold rounded-full border border-gc-gold/20 mb-4">
              {edicion.evento.nombre} · {format(edicion.fecha, "yyyy", { locale: es })}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight max-w-4xl">
              {edicion.titulo}
            </h1>
            <time className="text-white/60 text-sm font-body">
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

            {/* Contenido HTML */}
            <div
              className="prose prose-lg max-w-none font-body text-gc-green-800/80 leading-relaxed mb-10
                         prose-headings:font-display prose-headings:text-gc-green-800
                         prose-p:text-gc-green-800/80 prose-p:leading-relaxed
                         prose-a:text-gc-green prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: edicion.contenido }}
            />

            {/* Fotos */}
            {fotos.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-display font-bold text-gc-green-800 mb-4">Galería</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-gc-green/10">
                      <img
                        src={foto.url}
                        alt={foto.titulo || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-display font-bold text-gc-green-800 mb-4">Video</h2>
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
            <a
              href="/#eventos"
              className="inline-flex items-center gap-2 text-gc-green-800/60 hover:text-gc-green-800 font-body text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Eventos Garden
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
