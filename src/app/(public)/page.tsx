import { getConfig } from "@/lib/config";
import { getMediaImages, getMediaCover } from "@/lib/media";
import { redesSociales } from "@/data/redes";
import Navbar from "@/components/public/sections/Navbar";
import Hero from "@/components/public/sections/Hero";
import QuienesSomos from "@/components/public/sections/QuienesSomos";
import Convivencia from "@/components/public/sections/Convivencia";
import EventosDestacados from "@/components/public/sections/EventosDestacados";
import Galeria from "@/components/public/sections/Galeria";
import Niveles from "@/components/public/sections/Niveles";
import Recursos from "@/components/public/sections/Recursos";
import Admision from "@/components/public/sections/Admision";
import Contacto from "@/components/public/sections/Contacto";
import Footer from "@/components/public/sections/Footer";

// ISR: regenerar la página cada 60 segundos
export const revalidate = 60;

export default async function HomePage() {
  const config = await getConfig();

  // ── Media desde carpetas ────────────────────────────────────────────────
  const fotosQuienesSomos  = getMediaImages("QuienesSomos");
  const imagenAdmision     = getMediaCover("Admision");
  const imagenHeroMobile   = getMediaCover("Hero");

  const nombre = config["institucional.nombre"] || "Garden College";
  const slogan = config["institucional.slogan"] || "Educación sin fronteras";

  const sellos = [
    {
      titulo: config["sellos.vida_saludable.titulo"] || "Vida Saludable",
      descripcion: config["sellos.vida_saludable.descripcion"] || "",
      icono: config["sellos.vida_saludable.icono"] || "heart-pulse",
    },
    {
      titulo:
        config["sellos.formacion_cristiana.titulo"] || "Formación Cristiana",
      descripcion: config["sellos.formacion_cristiana.descripcion"] || "",
      icono: config["sellos.formacion_cristiana.icono"] || "book-open",
    },
    {
      titulo: config["sellos.ingles.titulo"] || "Inglés",
      descripcion: config["sellos.ingles.descripcion"] || "",
      icono: config["sellos.ingles.icono"] || "globe",
    },
  ];

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
      <Navbar
        nombre={nombre}
        telefono={sedes.map((s) => s.telefono).join(" | ")}
      />

      <main>
        <Hero
          nombre={nombre}
          slogan={slogan}
          mision={config["institucional.mision"] || ""}
          imagenMobile={imagenHeroMobile}
        />

        <QuienesSomos
          mision={config["institucional.mision"] || ""}
          vision={config["institucional.vision"] || ""}
          resena={config["institucional.resena"] || ""}
          fotos={fotosQuienesSomos.length > 0 ? fotosQuienesSomos : undefined}
          sellos={sellos}
        />

        <Convivencia
          titulo={config["convivencia.titulo"] || "Convivencia y Valores"}
          descripcion={config["convivencia.descripcion"] || ""}
          logros={config["convivencia.logros"] || []}
          pilares={config["convivencia.pilares"] || []}
          testimonio={config["convivencia.testimonio"] || null}
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
          imagen={imagenAdmision}
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
