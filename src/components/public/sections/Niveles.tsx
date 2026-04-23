import Image from "next/image";
import { getMediaImageMap } from "@/lib/media";

interface Nivel {
  nombre: string;
  niveles: string;
  sede: string;
  descripcion: string;
  slug?: string;
  imagen?: string;
}

interface NivelesProps {
  niveles: Nivel[];
  extras: string[];
}

const nivelBorders = [
  "border-l-4 border-gc-green-light",
  "border-l-4 border-gc-green",
  "border-l-4 border-gc-green-800",
];

export default function Niveles({ niveles, extras }: NivelesProps) {
  const imageMap = getMediaImageMap("Niveles");

  return (
    <section id="niveles" className="pt-12 pb-8">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="badge-navy mb-4 inline-block">Formación completa</span>
          <h2 className="section-heading">Niveles Educativos</h2>
          <p className="section-subheading mx-auto mt-4">
            Acompañamos a tus hijos desde prebásica hasta cuarto medio, en dos sedes en La Unión
          </p>
        </div>

        {/* Grid de niveles */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8 lg:mb-12">
          {niveles.map((nivel, i) => {
            const imgSrc = (nivel.slug && imageMap[`nivel-${nivel.slug}`])
              || nivel.imagen;
            return (
              <div key={nivel.nombre} className={`card overflow-hidden ${nivelBorders[i % nivelBorders.length]}`}>
                {imgSrc && (
                  <div className="relative aspect-[2/1]">
                    <Image
                      src={imgSrc}
                      alt={nivel.nombre}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6 lg:p-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-4 bg-gc-green-50 text-gc-green-dark border-gc-green-100">
                  {nivel.niveles}
                </div>
                <h3 className="text-lg font-display font-bold text-gc-green-800 mb-2">
                  {nivel.nombre}
                </h3>
                <p className="text-gc-green-800/60 font-body text-sm leading-relaxed mb-4">
                  {nivel.descripcion}
                </p>
                <div className="flex items-center gap-2 text-xs text-gc-green-800/40 font-body">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {nivel.sede}
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Programas extras */}
        {extras.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-sm font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-4">
              Programas y departamentos
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {extras.map((extra) => (
                <span
                  key={extra}
                  className="px-4 py-2 bg-gc-green-50 text-gc-green-800 font-body text-sm rounded-full border border-gc-green-100"
                >
                  {extra}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
