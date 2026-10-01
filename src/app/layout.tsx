import type { Metadata, Viewport } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { SITE_URL, OG_IMAGE, jsonLdSitio } from "@/lib/seo";
import JsonLd from "@/components/public/shared/JsonLd";
import ModoRevision from "@/components/public/shared/ModoRevision";
import "./globals.css";

// Script inline que corre ANTES del primer paint: si la cookie gc-tema pide el
// tema clásico, pone data-theme en <html> para que no haya parpadeo (navy ->
// verde) al cargar o navegar en MODO REVISIÓN. Una cookie vieja "uniforme" (de
// cuando el uniforme era la vista previa) se ignora: ya es el default. Es la única lectura de la cookie
// que ocurre "temprano"; el resto lo maneja src/lib/tema.ts en el cliente.
const NO_FLASH_TEMA = `(function(){try{var m=document.cookie.match(/(?:^|; )gc-tema=([^;]*)/);if(m&&decodeURIComponent(m[1])==='clasico'){document.documentElement.dataset.theme='clasico';}}catch(e){}})();`;

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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
  themeColor: "#0F1D38", // --gc-green-900 del tema uniforme (default)
  width: "device-width",
  initialScale: 1,
  // Celulares con cámara en la pantalla: al esconder la barra de direcciones,
  // algunos navegadores dibujan la página bajo la barra de estado y el navbar
  // fijo quedaba con el tope (el aro del logo) tapado. Con "cover" la zona es
  // nuestra y el navbar la compensa con env(safe-area-inset-top). Donde no
  // existe esa zona el inset vale 0 y nada cambia.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-CL"
      className={`${lora.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica el tema clásico desde la cookie antes de pintar (sin parpadeo).
            suppressHydrationWarning en <html> porque este script toca data-theme,
            que React no controla y difiere entre server y cliente en MODO REVISIÓN. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_TEMA }} />
        {/* Datos estructurados del colegio — alimentan el panel de conocimiento
            y las búsquedas locales. Van en el layout para estar en toda página. */}
        <JsonLd data={jsonLdSitio()} />
      </head>
      <body>
        {children}
        {/* Aviso flotante del MODO REVISIÓN (solo visible con la vista previa activa). */}
        <ModoRevision />
      </body>
    </html>
  );
}
