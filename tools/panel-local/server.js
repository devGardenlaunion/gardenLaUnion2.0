// Panel local de Garden College — compresor genérico de medios. SOLO corre
// en tu máquina, nunca se despliega, nunca se expone a internet. Ver
// README.md.

const path = require("path");
const fs = require("fs/promises");
const express = require("express");
const multer = require("multer");

const { procesarFoto, esFotoAceptada } = require("./lib/procesarFoto");
const { procesarVideo, esVideoAceptado } = require("./lib/procesarVideo");
const { listarArchivos, listarSlugs, RAIZ_MEDIA_EVENTOS } = require("./lib/inventarioMedios");

const PUERTO = process.env.PANEL_PUERTO || 4747;

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Sirve los medios reales del repo (solo lectura) para poder previsualizarlos
// en el panel — solo alcanzable en 127.0.0.1, no hay riesgo en exponerlo así.
app.use("/vista-media", express.static(RAIZ_MEDIA_EVENTOS));

function validarSlug(slug) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || "")) {
    throw new Error(`Slug inválido: "${slug}" — minúsculas y guiones, como "gala-folclorica".`);
  }
}

function validarDestino(destino) {
  if (destino === "hero" || destino === "polaroid") return;
  if (/^\d{4}$/.test(destino)) return;
  throw new Error(`Destino inválido: "${destino}" — debe ser "hero", "polaroid" o un año de 4 dígitos.`);
}

// Sin esto, un nombre de archivo con "../" podría borrar/leer algo fuera de
// la carpeta del evento — nunca debería pasar desde la UI, pero la
// validación es gratis y evita sorpresas.
function validarNombreArchivo(nombre) {
  if (!nombre || nombre.includes("/") || nombre.includes("\\") || nombre.includes("..")) {
    throw new Error(`Nombre de archivo inválido: "${nombre}".`);
  }
}

app.get("/api/slugs", async (_req, res) => {
  res.json({ ok: true, slugs: await listarSlugs() });
});

app.get("/api/carpeta/:slug/:destino", async (req, res) => {
  try {
    const { slug, destino } = req.params;
    validarSlug(slug);
    validarDestino(destino);
    res.json({ ok: true, archivos: await listarArchivos(slug, destino) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post("/api/comprimir-medios", upload.array("archivos"), async (req, res) => {
  try {
    const { slug, destino } = req.body;
    validarSlug(slug);
    validarDestino(destino);

    const dirDestino = path.join(RAIZ_MEDIA_EVENTOS, slug, destino);
    await fs.mkdir(dirDestino, { recursive: true });

    const resultados = [];
    for (const archivo of req.files || []) {
      if (esFotoAceptada(archivo.originalname)) {
        const { buffer, nombreSalida } = await procesarFoto(archivo.buffer, archivo.originalname);
        await fs.writeFile(path.join(dirDestino, nombreSalida), buffer);
        resultados.push({ entrada: archivo.originalname, salida: [nombreSalida] });
      } else if (esVideoAceptado(archivo.originalname)) {
        const salidas = await procesarVideo(archivo.buffer, archivo.originalname);
        for (const s of salidas) {
          await fs.writeFile(path.join(dirDestino, s.nombreSalida), s.buffer);
        }
        resultados.push({ entrada: archivo.originalname, salida: salidas.map((s) => s.nombreSalida) });
      } else {
        resultados.push({ entrada: archivo.originalname, error: "Extensión no soportada, se omitió." });
      }
    }

    res.json({ ok: true, destino: `public/media/eventos/${slug}/${destino}/`, resultados });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

const EXT_VIDEO_SERVER = new Set([".mp4", ".webm", ".mov"]);
const EXT_POSIBLE_POSTER = [".jpg", ".jpeg", ".webp", ".png"];

app.post("/api/eliminar", async (req, res) => {
  try {
    const { slug, destino, archivo } = req.body;
    validarSlug(slug);
    validarDestino(destino);
    validarNombreArchivo(archivo);

    const dir = path.join(RAIZ_MEDIA_EVENTOS, slug, destino);
    const eliminados = [];
    async function borrarSiExiste(nombre) {
      try {
        await fs.unlink(path.join(dir, nombre));
        eliminados.push(nombre);
      } catch {
        // no existía — nada que hacer
      }
    }

    await borrarSiExiste(archivo);

    // Si es el video "principal" (no la variante -mobile), de paso limpia su
    // poster y su -mobile — si no, quedan huérfanos y el poster se cuela
    // como foto suelta en la galería.
    const ext = path.extname(archivo).toLowerCase();
    const base = path.basename(archivo, ext);
    if (EXT_VIDEO_SERVER.has(ext) && !base.endsWith("-mobile")) {
      for (const extPoster of EXT_POSIBLE_POSTER) await borrarSiExiste(`${base}${extPoster}`);
      await borrarSiExiste(`${base}-mobile.mp4`);
    }

    res.json({ ok: true, eliminados });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.listen(PUERTO, "127.0.0.1", () => {
  console.log(`Panel local en http://127.0.0.1:${PUERTO} — solo alcanzable desde esta máquina.`);
});
