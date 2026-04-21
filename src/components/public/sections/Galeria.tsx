import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getConfig } from "@/lib/config";
import GaleriaDynamic from "@/components/public/shared/GaleriaDynamic";
import { type FotoColumnas } from "@/components/public/shared/GaleriaColumnas";

const GALERIA_DIR = path.join(process.cwd(), "public", "media", "Galeria");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// Placeholders para cuando la carpeta Galeria está vacía (solo desarrollo)
const PLACEHOLDER_FOTOS: FotoColumnas[] = [
  { src: "https://picsum.photos/seed/gc1/800/600",  width: 800,  height: 600,  alt: "Actividad escolar" },
  { src: "https://picsum.photos/seed/gc2/600/900",  width: 600,  height: 900,  alt: "Vida estudiantil" },
  { src: "https://picsum.photos/seed/gc3/900/600",  width: 900,  height: 600,  alt: "Comunidad Garden" },
  { src: "https://picsum.photos/seed/gc4/700/1000", width: 700,  height: 1000, alt: "Eventos destacados" },
  { src: "https://picsum.photos/seed/gc5/1000/700", width: 1000, height: 700,  alt: "Convivencia" },
  { src: "https://picsum.photos/seed/gc6/600/600",  width: 600,  height: 600,  alt: "Talleres" },
  { src: "https://picsum.photos/seed/gc7/800/1100", width: 800,  height: 1100, alt: "Deporte" },
  { src: "https://picsum.photos/seed/gc8/1100/700", width: 1100, height: 700,  alt: "Arte y cultura" },
  { src: "https://picsum.photos/seed/gc9/700/500",  width: 700,  height: 500,  alt: "Celebración" },
];

async function getFotosGaleria(): Promise<FotoColumnas[]> {
  if (!fs.existsSync(GALERIA_DIR)) return PLACEHOLDER_FOTOS;

  const archivos = fs
    .readdirSync(GALERIA_DIR)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  if (archivos.length === 0) return PLACEHOLDER_FOTOS;

  const MAX_FOTOS = 9;

  return Promise.all(
    archivos.slice(0, MAX_FOTOS).map(async (archivo) => {
      const nombre = path.basename(archivo, path.extname(archivo));
      try {
        const meta = await sharp(path.join(GALERIA_DIR, archivo)).metadata();
        return {
          src: `/media/Galeria/${archivo}`,
          width: meta.width ?? 1200,
          height: meta.height ?? 800,
          alt: nombre.replace(/[-_]/g, " "),
        };
      } catch {
        return { src: `/media/Galeria/${archivo}`, width: 1200, height: 800, alt: nombre.replace(/[-_]/g, " ") };
      }
    })
  );
}

export default async function Galeria() {
  const [config, fotos] = await Promise.all([getConfig(), getFotosGaleria()]);

  const titulo = config["galeria.titulo"] || "Galería";
  const badge = config["galeria.badge"] || "Momentos Garden";

  return (
    <section id="galeria" className="py-8 sm:py-12 section-alt">
      <div className="container-gc">
        <div className="text-center mb-10 lg:mb-14">
          <span className="badge-gold mb-4 inline-block">{badge}</span>
          <h2 className="section-heading">{titulo}</h2>
        </div>

        <GaleriaDynamic fotos={fotos} className="max-w-6xl mx-auto" />
      </div>
    </section>
  );
}
