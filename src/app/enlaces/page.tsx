import type { Metadata } from "next";
import Image from "next/image";
import { getConfig } from "@/lib/config";
import { redesSociales } from "@/data/redes";
import IconoRed, { NOMBRE_DE_RED, type Red } from "@/components/public/shared/IconoRed";

/**
 * **Todos los enlaces del colegio en una página** (dev, 2026-11-21: «una página como esas que tienen todas las redes, y
 * que los QR del colegio dirijan ahí»). Es a lo que apunta el QR de la vitrina y el de cualquier papel o afiche: un QR
 * impreso no se puede cambiar, esta página sí.
 *
 * Pensada para el teléfono (quien escanea un QR): una columna, botones grandes. Estática como el resto del sitio.
 * Las redes salen de `src/data/redes.ts` (las mismas del Footer) y los textos de `src/content/config.ts`; una red sin
 * URL real (p. ej. WhatsApp mientras sea un placeholder) no se muestra.
 */
export const metadata: Metadata = {
  title: "Enlaces",
  description: "Redes sociales, admisión, documentos y contacto de Garden College, La Unión.",
  alternates: { canonical: "/enlaces" },
  openGraph: { type: "website", url: "/enlaces", title: "Enlaces | Garden College La Unión" },
};

const REDES: Red[] = ["instagram", "facebook", "tiktok", "youtube"];

/** «@garden.launion» desde la URL de la red; si la URL no trae un usuario (Facebook), el nombre de la red. */
function usuarioDe(url: string): string | null {
  const segmentos = new URL(url).pathname.split("/").filter(Boolean);
  const arroba = segmentos.find((s) => s.startsWith("@"));
  if (arroba) return arroba;
  if (segmentos.length === 1) return `@${segmentos[0]}`;
  return null;
}

export default async function Enlaces() {
  const c = await getConfig();
  const redes = REDES.flatMap((red) => {
    const url = (redesSociales as Record<string, string>)[red];
    return url?.startsWith("https://") ? [{ red, url, usuario: usuarioDe(url) }] : [];
  });
  const sitio: { titulo: string; detalle?: string; href: string; externo?: boolean }[] = [
    { titulo: "Sitio web del colegio", href: "/" },
    {
      titulo: "Admisión",
      detalle: "Postulación por el Sistema de Admisión Escolar (Mineduc)",
      href: c["admision.link_sae"],
      externo: true,
    },
    { titulo: "Historias", detalle: c["eventos.subtitulo"], href: "/#eventos" },
    { titulo: "Documentos", detalle: "PEI, reglamentos y protocolos", href: "/documentos" },
    { titulo: "Contacto", detalle: c["contacto.email"], href: "/#contacto" },
  ];

  return (
    <main className="min-h-dvh bg-gc-green-900 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10">
        {/* El escudo del león junto al GC (dev, 2026-11-21). */}
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            <Image src="/media/Logo/leon-circulo.webp" alt="Escudo de Garden College" fill sizes="96px" className="object-contain" priority />
          </div>
          <div className="relative h-24 w-24">
            <Image src="/media/Logo/gc-identidad.webp" alt="" aria-hidden="true" fill sizes="96px" className="logo-actual object-contain" priority />
            <Image src="/media/Logo/gc-identidad-uniforme.webp" alt="" aria-hidden="true" fill sizes="96px" className="logo-uniforme object-contain" priority />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">{c["institucional.nombre"]}</h1>
          <p className="mt-1 font-body text-white/70">
            {c["institucional.slogan"]} · {c["institucional.ciudad"]}
          </p>
        </div>

        <ul className="grid w-full grid-cols-2 gap-3">
          {redes.map(({ red, url, usuario }) => (
            <li key={red}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center transition-colors hover:border-gc-gold/40 hover:bg-gc-gold/15"
              >
                <IconoRed red={red} className="h-7 w-7 text-gc-gold" />
                <span className="font-body font-semibold">{NOMBRE_DE_RED[red]}</span>
                {usuario && <span className="font-body text-xs text-white/60">{usuario}</span>}
              </a>
            </li>
          ))}
        </ul>

        <ul className="flex w-full flex-col gap-3">
          {sitio.map((e) => (
            <li key={e.titulo}>
              <a
                href={e.href}
                {...(e.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex min-h-14 flex-col justify-center rounded-xl bg-white px-4 py-3 text-gc-gray-900 transition-colors hover:bg-gc-cream"
              >
                <span className="font-body font-semibold">{e.titulo}</span>
                {e.detalle && <span className="font-body text-sm text-gc-gray-700">{e.detalle}</span>}
              </a>
            </li>
          ))}
        </ul>

        <p className="text-center font-body text-xs text-white/40">{c["institucional.corporacion"]}</p>
      </div>
    </main>
  );
}
