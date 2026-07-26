import type { MetadataRoute } from "next";
import { getEventosPublicados } from "@/lib/eventos";
import { absUrl } from "@/lib/seo";

/**
 * sitemap.xml — se genera en el build a partir del contenido real.
 *
 * Sólo entran páginas indexables: la home, el centro de documentación y las
 * subpáginas de eventos PUBLICADOS. Un evento con `publicado: false` no aparece
 * (tampoco existe como página: ver `dynamicParams = false`).
 *
 * Las anclas de la onepage (#admision, #contacto…) no van: Google no indexa
 * fragmentos como URLs propias, y listarlas sólo diluye el sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();

  return [
    {
      url: absUrl("/"),
      lastModified: hoy,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absUrl("/documentos"),
      lastModified: hoy,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...getEventosPublicados().map((evento) => ({
      url: absUrl(`/eventos/${evento.slug}`),
      lastModified: new Date(evento.fecha),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
