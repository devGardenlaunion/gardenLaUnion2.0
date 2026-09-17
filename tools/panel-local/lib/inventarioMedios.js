// Inventario de medios — solo lectura, para ver qué hay en una carpeta antes
// de subir más o borrar algo.

const fs = require("fs/promises");
const path = require("path");

const RAIZ_MEDIA_EVENTOS = path.join(__dirname, "..", "..", "..", "public", "media", "eventos");
const IGNORAR = new Set([".gitkeep", "LEEME.txt"]);

/** Archivos de una carpeta puntual (slug/destino) — null si la carpeta no existe. */
async function listarArchivos(slug, destino) {
  const dir = path.join(RAIZ_MEDIA_EVENTOS, slug, destino);
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const archivos = [];
    for (const item of items) {
      if (!item.isFile() || IGNORAR.has(item.name)) continue;
      const stat = await fs.stat(path.join(dir, item.name));
      archivos.push({ nombre: item.name, bytes: stat.size });
    }
    return archivos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch {
    return null;
  }
}

/** Slugs de eventos que ya tienen carpeta — para el autocompletado. */
async function listarSlugs() {
  try {
    const items = await fs.readdir(RAIZ_MEDIA_EVENTOS, { withFileTypes: true });
    return items.filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
}

module.exports = { listarArchivos, listarSlugs, RAIZ_MEDIA_EVENTOS };
