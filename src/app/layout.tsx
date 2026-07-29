import type { Metadata, Viewport } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { SITE_URL, OG_IMAGE, jsonLdSitio } from "@/lib/seo";
import JsonLd from "@/components/public/shared/JsonLd";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

/**
 * Metadata base de todo el sitio. Cada página puede sobrescribir title,
 * description y canonical; el resto se hereda.
 *
 * El title lleva "Colegio" a propósito: la búsqueda que trae apoderados nuevos
 * es "colegios en La Unión", no la marca. Quien ya conoce el nombre llega igual.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Garden College — Colegio en La Unión, Región de Los Ríos",
    template: "%s | Garden College La Unión",
  },
  description:
    "Colegio particular subvencionado en La Unión, Los Ríos. Prebásica a 4° Medio con énfasis en inglés, vida saludable y valores cristianos. Admisión vía SAE.",
  applicationName: "Garden College",
  keywords: [
    "Garden College",
    "colegio La Unión",
    "colegios en La Unión",
    "colegio inglés La Unión",
    "educación La Unión Los Ríos",
    "Provincia del Ranco",
    "admisión escolar La Unión",
    "colegio particular subvencionado La Unión",
    "Corporación Educacional Filadelfia Garden",
  ],
  authors: [{ name: "Garden College", url: SITE_URL }],
  creator: "Garden College",
  publisher: "Corporación Educacional Filadelfia Garden",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "Garden College",
    title: "Garden College — Colegio en La Unión, Región de Los Ríos",
    description:
      "Educación integral con énfasis en inglés, vida saludable y valores cristianos. Prebásica a 4° Medio en La Unión.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Garden College — Colegio en La Unión, Región de Los Ríos",
    description:
      "Educación integral con énfasis en inglés, vida saludable y valores cristianos. Prebásica a 4° Medio en La Unión.",
    images: [OG_IMAGE.url],
  },
  icons: {
    // Rebrand oficializado en esta rama: la identidad ante Google es el isotipo
    // GC en los cuatro touchpoints (favicon, structured data, apple, OG).
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
    ],
    shortcut: "/favicon.png",
    apple: "/media/Logo/gc-identidad.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "education",
  // Google Search Console: pegar acá el token de verificación por meta tag.
  // verification: { google: "..." },
};

export const viewport: Viewport = {
  themeColor: "#0A1420",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={`${lora.variable} ${sourceSans.variable}`}>
      <head>
        {/* Datos estructurados del colegio — alimentan el panel de conocimiento
            y las búsquedas locales. Van en el layout para estar en toda página. */}
        <JsonLd data={jsonLdSitio()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
