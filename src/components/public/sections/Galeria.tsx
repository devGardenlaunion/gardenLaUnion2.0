import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getConfig } from "@/lib/config";
import { altDesdeArchivo } from "@/lib/media";
import GaleriaColumnas, { type FotoColumnas } from "@/components/public/shared/GaleriaColumnas";

const ALT_POR_DEFECTO =
  "Comunidad escolar de Garden College, La Unión — Región de Los Ríos";

const GALERIA_DIR = path.join(process.cwd(), "public", "media", "Galeria");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/**
 * Sin placeholders externos: antes esto caía en picsum.photos si la carpeta
 * estaba vacía. En producción eso significaba fotos de stock aleatorias con el
 * alt equivocado y un dominio de terceros en el LCP. Carpeta vacía = sección
 * que no se renderiza.
 */
async function getFotosGaleria(): Promise<FotoColumnas[]> {
  if (!fs.existsSync(GALERIA_DIR)) return [];

  const archivos = fs
    .readdirSync(GALERIA_DIR)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  // 10: en móvil (grid 2-col) da 5 filas limpias; en desktop el masonry de 3
  // columnas se balancea por altura, así que absorbe la 10ª sin desordenar.
  const MAX_FOTOS = 10;

  return Promise.all(
    archivos.slice(0, MAX_FOTOS).map(async (archivo, i) => {
      // La mayoría son volcados de cámara (IMG_/WhatsApp), así que caen al alt
      // por defecto. Si todas quedaran con el mismo texto, un lector de pantalla
      // leería 9 veces lo mismo. Se numera el fallback para que cada foto tenga
      // un alt único (criterio Ciclo 5: nada repetido >2×). Las que sí tienen
      // nombre descriptivo conservan su alt propio.
      const base = altDesdeArchivo(archivo, ALT_POR_DEFECTO);
      const alt = base === ALT_POR_DEFECTO ? `${ALT_POR_DEFECTO} (${i + 1})` : base;
      const src = `/media/Galeria/${encodeURIComponent(archivo)}`;
      try {
        const meta = await sharp(path.join(GALERIA_DIR, archivo)).metadata();
        return { src, width: meta.width ?? 1200, height: meta.height ?? 800, alt };
      } catch {
        return { src, width: 1200, height: 800, alt };
      }
    })
  );
}

export default async function Galeria() {
  const [config, fotos] = await Promise.all([getConfig(), getFotosGaleria()]);

  if (fotos.length === 0) return null;

  const titulo = config["galeria.titulo"] || "Galería";
  const badge = config["galeria.badge"] || "Momentos Garden";

  return (
    <section id="galeria" className="py-8 sm:py-12 section-alt">
      <div className="container-gc">
        <div className="text-center mb-4">
          <span className="badge-gold mb-4 inline-block">{badge}</span>
          <h2 className="section-heading">{titulo}</h2>
        </div>

        <GaleriaColumnas fotos={fotos} className="max-w-6xl mx-auto" />
      </div>
    </section>
  );
}
