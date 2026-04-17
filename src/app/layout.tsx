import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Garden College — La Unión, Región de Los Ríos",
    template: "%s | Garden College",
  },
  description:
    "Colegio particular subvencionado en La Unión, Chile. Educación Pre-Kínder a 4° Medio con énfasis en inglés, vida saludable y valores cristianos. Corporación Educacional Filadelfia Garden.",
  keywords: [
    "Garden College",
    "colegio La Unión",
    "educación La Unión",
    "colegio inglés La Unión",
    "Región de Los Ríos",
    "admisión colegio",
  ],
  authors: [{ name: "Garden College" }],
  creator: "Garden College",
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Garden College",
    title: "Garden College — La Unión, Región de Los Ríos",
    description:
      "Educación integral con énfasis en inglés, vida saludable y valores cristianos. Pre-Kínder a 4° Medio.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${lora.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
