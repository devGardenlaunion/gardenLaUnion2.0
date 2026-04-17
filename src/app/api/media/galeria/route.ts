import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { FotoColumnas } from "@/components/public/shared/GaleriaColumnas";

const GALERIA_DIR = path.join(process.cwd(), "public", "media", "Galeria");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function GET() {
  try {
    if (!fs.existsSync(GALERIA_DIR)) {
      return NextResponse.json({ fotos: [] });
    }

    const archivos = fs
      .readdirSync(GALERIA_DIR)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort();

    const fotos: FotoColumnas[] = await Promise.all(
      archivos.map(async (archivo) => {
        const rutaAbsoluta = path.join(GALERIA_DIR, archivo);
        const src = `/media/Galeria/${archivo}`;
        const nombre = path.basename(archivo, path.extname(archivo));

        try {
          const meta = await sharp(rutaAbsoluta).metadata();
          return {
            src,
            width: meta.width ?? 1200,
            height: meta.height ?? 800,
            alt: nombre.replace(/[-_]/g, " "),
          };
        } catch {
          return { src, width: 1200, height: 800, alt: nombre.replace(/[-_]/g, " ") };
        }
      })
    );

    return NextResponse.json({ fotos }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    console.error("[api/media/galeria]", error);
    return NextResponse.json({ fotos: [] }, { status: 500 });
  }
}
