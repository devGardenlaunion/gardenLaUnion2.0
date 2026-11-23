import type { MetadataRoute } from "next";
import { SITE_URL, absUrl } from "@/lib/seo";

/**
 * robots.txt
 *
 * En los deploys de preview de Vercel se bloquea TODO: si Google indexa un
 * preview, ese dominio compite con el sitio real por las mismas búsquedas y
 * termina apareciendo `garden-web-xxxx.vercel.app` en vez de gardenlaunion.cl.
 */
export default function robots(): MetadataRoute.Robots {
  const esProduccion = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : SITE_URL.startsWith("https://");

  if (!esProduccion) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/contacto sólo acepta POST; no hay nada que rastrear ahí.
      // /vitrina pide clave y es para pantallas en eventos, no para buscar.
      disallow: ["/api/", "/vitrina"],
    },
    sitemap: absUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
