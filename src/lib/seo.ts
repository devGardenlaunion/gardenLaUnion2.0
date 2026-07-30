/**
 * SEO — URL canónica y datos estructurados (JSON-LD).
 *
 * Todo lo que Google necesita para entender QUÉ es este sitio y DÓNDE está
 * sale de acá. Los datos no se escriben a mano: se leen de
 * src/content/config.ts, que es la fuente única de contenido.
 *
 * Ver docs/SEO.md para el detalle de qué se emite y por qué.
 */

import { contenido } from "@/content/config";

/**
 * `contenido` es un objeto `as const` con valores heterogéneos (strings,
 * arrays, objetos). Acá sólo se leen claves conocidas, así que se accede por un
 * índice suelto en vez de arrastrar el tipo literal completo.
 */
const c = contenido as unknown as Record<string, any>;

/**
 * Dominio canónico del sitio, sin barra final.
 *
 * Orden de resolución:
 *   1. SITE_URL / NEXT_PUBLIC_SITE_URL → definida a mano en Vercel. Manda en
 *      producción; es el override garantizado.
 *   2. VERCEL_PROJECT_PRODUCTION_URL → dominio de producción ESTABLE que Vercel
 *      inyecta en el build (no cambia entre deploys). Es lo que corresponde para
 *      canonical y og:image, así producción nunca emite localhost aunque nadie
 *      haya seteado SITE_URL. Requiere que "Automatically expose System
 *      Environment Variables" esté activo (default en Vercel).
 *   3. VERCEL_URL → URL específica del deploy; respaldo para previews, para que
 *      un preview se referencie a sí mismo y no a producción.
 *   4. localhost → sólo desarrollo.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000"
).replace(/\/$/, "");

/**
 * URL absoluta a partir de una ruta del sitio, sin barra final.
 *
 * La forma tiene que ser IDÉNTICA a la que Next emite en el `<link rel=
 * "canonical">`, que normaliza "/" a "https://dominio" sin barra. Si el sitemap
 * dice "https://dominio/" y el canonical dice "https://dominio", Google ve dos
 * URLs para la misma página y reparte el ranking entre ambas.
 */
export const absUrl = (ruta = "/"): string =>
  new URL(ruta, SITE_URL + "/").toString().replace(/\/$/, "");

/** Imagen para redes sociales (WhatsApp, Facebook, Instagram, X). */
export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Garden College — La Unión, Región de Los Ríos",
} as const;

/**
 * "(64) 232 4545" → "+56642324545".
 * Schema.org pide E.164; los humanos leen el formato bonito en la web.
 */
function aE164(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return digitos ? `+56${digitos}` : "";
}

/** Una sede como `Place` de schema.org, con dirección postal y coordenadas. */
function sede(prefijo: "contacto.sede_basica" | "contacto.sede_media") {
  const direccion = c[`${prefijo}.direccion`] ?? "";
  // "Los Carrera 387, La Unión" → calle = "Los Carrera 387"
  const calle = direccion.split(",")[0]?.trim() ?? direccion;

  return {
    "@type": "Place",
    name: c[`${prefijo}.nombre`],
    telephone: aE164(c[`${prefijo}.telefono`] ?? ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: calle,
      addressLocality: "La Unión",
      addressRegion: "Región de Los Ríos",
      addressCountry: "CL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: Number(c[`${prefijo}.lat`]),
      longitude: Number(c[`${prefijo}.lng`]),
    },
  };
}

/**
 * Grafo principal del sitio: la escuela + el sitio web.
 *
 * `School` es el tipo correcto (hereda de EducationalOrganization y de
 * LocalBusiness), y es el que alimenta el panel de conocimiento de Google y las
 * búsquedas locales tipo "colegios en La Unión".
 */
export function jsonLdSitio() {
  const idColegio = `${SITE_URL}/#colegio`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "School",
        "@id": idColegio,
        name: c["institucional.nombre"],
        alternateName: [
          "Colegio Garden College",
          "Garden La Unión",
          "El colegio inglés de La Unión",
        ],
        legalName: c["institucional.corporacion"],
        description: c["institucional.resena"],
        slogan: c["institucional.slogan"],
        url: SITE_URL,
        logo: absUrl("/media/Logo/cropped-cropped-logo.png"),
        image: absUrl(OG_IMAGE.url),
        email: c["contacto.email"],
        telephone: aE164(c["contacto.sede_basica.telefono"] ?? ""),
        foundingDate: "2004-10-29",
        // RBD: el identificador oficial del establecimiento ante el Mineduc.
        identifier: {
          "@type": "PropertyValue",
          name: "RBD",
          value: c["institucional.rbd"],
        },
        employee: {
          "@type": "Person",
          name: c["institucional.director"],
          jobTitle: "Director",
        },
        // La dirección de nivel superior es la sede principal (Parvularia y Básica).
        address: sede("contacto.sede_basica").address,
        geo: sede("contacto.sede_basica").geo,
        location: [sede("contacto.sede_basica"), sede("contacto.sede_media")],
        areaServed: [
          { "@type": "City", name: "La Unión" },
          { "@type": "AdministrativeArea", name: "Provincia del Ranco" },
          { "@type": "AdministrativeArea", name: "Región de Los Ríos" },
        ],
        // Los niveles que imparte — le dice a Google para qué búsquedas califica.
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Niveles educativos",
          itemListElement: (c["niveles.info"] as any[]).map((n) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Course",
              name: n.nombre,
              description: `${n.niveles} — ${n.descripcion}`,
              provider: { "@id": idColegio },
            },
          })),
        },
        sameAs: [
          c["redes.facebook"],
          c["redes.instagram"],
          c["redes.youtube"],
        ].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: c["institucional.nombre"],
        inLanguage: "es-CL",
        publisher: { "@id": idColegio },
      },
    ],
  };
}

/** Migas para páginas internas — Google las muestra en vez de la URL cruda. */
export function jsonLdBreadcrumb(
  items: { nombre: string; ruta: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nombre,
      item: absUrl(item.ruta),
    })),
  };
}
