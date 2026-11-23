import type { Metadata } from "next";
import EntradaVitrina from "@/components/vitrina/EntradaVitrina";
import type { Guiones } from "@/components/vitrina/Vitrina";
import { archivosDe, guionDe, PANTALLAS, qrDeLaVitrina, VERSIONES } from "@/lib/vitrina/guion";
import "./vitrina.css";

/**
 * **La vitrina del colegio** (traída de gcadmin el 2026-11-23): el colegio en loop para una pantalla en un evento,
 * horizontal (TV) o vertical (tótem de pie, 9:16).
 *
 * **Abierta y estática, a propósito** (dev, 2026-11-23: «quita lo de la autentificación, no hay para qué complicarse;
 * blinda el código para que no nos vayan a romper la página»). Se probó con clave y authenticator, pero todo lo que
 * muestra ya es público en el sitio. Sin clave no hace falta servidor: las cuatro combinaciones (versión × pantalla) se
 * arman en el build desde `src/lib/vitrina/contenido.json` y la página es un archivo estático más. **No hay API ni nada
 * que corra en el servidor** que alguien pueda bombardear o romper; lo único que pide son las fotos y videos de
 * `/media/`, que el sitio ya sirve.
 *
 * Fuera de buscadores (`noindex` aquí y `disallow` en robots.ts) y del sitemap: no es una página para visitar.
 */
export const metadata: Metadata = {
  title: "Vitrina",
  robots: { index: false, follow: false },
};

export default function PaginaVitrina() {
  const guiones: Guiones = {};
  for (const version of Object.keys(VERSIONES)) {
    guiones[version] = {};
    for (const pantalla of Object.keys(PANTALLAS)) {
      const pasos = guionDe(version, pantalla);
      guiones[version][pantalla] = { pasos, archivos: archivosDe(pasos) };
    }
  }
  return <EntradaVitrina guiones={guiones} qr={qrDeLaVitrina} />;
}
