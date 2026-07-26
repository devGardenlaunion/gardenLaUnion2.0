import { getConfig } from "@/lib/config";
import { getMediaCover, getMediaImages, getMediaVideos } from "@/lib/media";
import { shuffle } from "@/lib/utils";
import { redesSociales } from "@/data/redes";
import Navbar from "@/components/public/sections/Navbar";
import HashScrollClient from "@/components/public/shared/HashScrollClient";
import Hero from "@/components/public/sections/Hero";
import QuienesSomos from "@/components/public/sections/QuienesSomos";
import Sellos from "@/components/public/sections/Sellos";
import EventosDestacados from "@/components/public/sections/EventosDestacados";
import Galeria from "@/components/public/sections/Galeria";
import Niveles from "@/components/public/sections/Niveles";
import Recursos from "@/components/public/sections/Recursos";
import Admision from "@/components/public/sections/Admision";
import Contacto from "@/components/public/sections/Contacto";
import Footer from "@/components/public/sections/Footer";

/**
 * Página 100% estática — se arma en el build y no se regenera en runtime.
 *
 * Es obligatorio que sea así: esta página lee los medios con `fs` desde
 * public/media/. En Vercel, public/ se sirve por CDN y NO viaja dentro del
 * bundle de la función serverless, así que cualquier render en runtime (ISR o
 * SSR) encontraría las carpetas vacías y publicaría la home sin fotos ni video
 * encima de la buena.
 *
 * No se pierde nada: el contenido vive en src/content/ y en public/media/, o
 * sea que sólo cambia con un push — y cada push dispara un build nuevo.
 */
export const dynamic = "force-static";

export default async function HomePage() {
  const config = await getConfig();

  // ── Media desde carpetas ────────────────────────────────────────────────
  const imagenHeroMobile   = getMediaCover("Hero");

  // Carrusel de admisión: fotos reales de la comunidad desde la carpeta.
  // Se barajan una vez por build, así el orden varía entre deploys.
  const imagenesAdmision = shuffle(
    getMediaImages("Admision").map((f) => f.src)
  );

  // Video del hero: se lee de public/media/Hero/ — cualquier nombre sirve.
  // webm primero (más liviano) y mp4 de fallback si existe. El poster es la
  // primera imagen de la carpeta, si hay.
  const heroVideoSources = getMediaVideos("Hero")
    .map((src) => ({
      src,
      type: /\.webm$/i.test(src)
        ? "video/webm"
        : /\.mov$/i.test(src)
        ? "video/quicktime"
        : "video/mp4",
    }))
    .sort((a, b) => (a.type === "video/webm" ? -1 : b.type === "video/webm" ? 1 : 0));

  // Carrusel de la card visual de Sellos: se lee de la carpeta en vez de
  // hardcodear nombres, así basta con soltar archivos ahí. Se usan todas; el
  // shuffle solo define el orden del crossfade, que rota en cada build.
  const imagenesSellos = shuffle(
    getMediaImages("carousel-cards/convivencia").map((f) => f.src)
  );

  const nombre = config["institucional.nombre"] || "Garden College";
  const slogan = config["institucional.slogan"] || "Educación sin fronteras";

  const sellosCards = config["sellos.cards"] || [];

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

  return (
    <>
      {/*
        HashScrollClient: corrige el scroll al navegar desde páginas secundarias con hash.
        Para activar el loop de media: pasar mediaUrl y mediaType.
        Ej: mediaUrl="/media/LoadingOverlay/loop.mp4" mediaType="mp4"
        El archivo debe ir en public/media/LoadingOverlay/ (< 2MB, sin audio).
      */}
      <HashScrollClient />
      <Navbar
        nombre={nombre}
        telefonoBasica={sedes[0]?.telefono}
        telefonoMedia={sedes[1]?.telefono}
      />

      <main>
        <Hero
          nombre={nombre}
          slogan={slogan}
          mision={config["institucional.mision"] || ""}
          imagenMobile={imagenHeroMobile}
          videoSources={heroVideoSources}
          videoPoster={imagenHeroMobile}
        />

        <QuienesSomos
          mision={config["institucional.mision"] || ""}
          vision={config["institucional.vision"] || ""}
          resena={config["institucional.resena"] || ""}
        />

        <Sellos
          titulo={config["sellos.titulo"] || "Lo que nos distingue"}
          descripcion={config["sellos.descripcion"] || ""}
          cta={config["sellos.cta"] || null}
          cards={sellosCards}
          imagenesCarrusel={imagenesSellos}
        />

        <EventosDestacados />

        <Galeria />

        <Niveles
          niveles={config["niveles.info"] || []}
          extras={config["niveles.extras"] || []}
        />

        <Recursos />

        <Admision
          info={config["admision.info"] || ""}
          linkSae={config["admision.link_sae"] || "#"}
          imagenes={imagenesAdmision}
        />

        <Contacto sedes={sedes} redes={redesSociales} />
      </main>

      <Footer
        nombre={nombre}
        corporacion={config["institucional.corporacion"] || ""}
        redes={redesSociales}
      />
    </>
  );
}
