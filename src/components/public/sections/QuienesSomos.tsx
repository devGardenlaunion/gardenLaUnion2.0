import GaleriaPolaroid, { FotoPolaroid } from "@/components/public/shared/GaleriaPolaroid";
import InfoCard from "@/components/public/shared/InfoCard";

interface Sello {
  titulo: string;
  descripcion: string;
  icono: string;
}

interface QuienesSomosProps {
  mision: string;
  vision: string;
  resena: string;
  fotos?: FotoPolaroid[];
  sellos?: Sello[];
}

const iconMap: Record<string, JSX.Element> = {
  "heart-pulse": (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  "book-open": (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  globe: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
};

const FOTOS_PLACEHOLDER: FotoPolaroid[] = [
  { src: "https://picsum.photos/seed/gc-qs-1/400/400", caption: "Vida en el colegio" },
  { src: "https://picsum.photos/seed/gc-qs-2/400/400", caption: "Actividades 2024" },
  { src: "https://picsum.photos/seed/gc-qs-3/400/400", caption: "Comunidad Garden" },
  { src: "https://picsum.photos/seed/gc-qs-4/400/400", caption: "Talleres y deportes" },
  { src: "https://picsum.photos/seed/gc-qs-5/400/400", caption: "Nuestra historia" },
  { src: "https://picsum.photos/seed/gc-qs-6/400/400", caption: "Formación integral" },
];

export default function QuienesSomos({
  mision,
  vision,
  resena,
  fotos = FOTOS_PLACEHOLDER,
  sellos = [],
}: QuienesSomosProps) {
  return (
    <section id="quienes-somos" className="pt-12 pb-8">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="badge-gold mb-4 inline-block">Nuestra historia</span>
          <h2 className="section-heading">Quiénes Somos</h2>
        </div>

        {/* 2-col layout: texto + galería */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start max-w-6xl mx-auto">

          {/* Columna texto (order-2 en mobile → va debajo de las fotos) */}
          <div className="order-2 lg:order-1">
            {/* Reseña */}
            {resena && (
              <p className="text-gc-green-800/70 font-body text-lg leading-relaxed mb-8">
                {resena}
              </p>
            )}

            {/* Misión */}
            <InfoCard title="Misión" description={mision} accent="gold" className="mb-4" />

            {/* Visión */}
            <InfoCard title="Visión" description={vision} accent="green" />

            {/* Datos institucionales */}
            <div className="flex flex-wrap gap-8 mt-8">
              {[
                { valor: "2004", label: "Año de fundación" },
                { valor: "2019", label: "Educación Adventista" },
                { valor: "Pre-K → 4°M", label: "Niveles educativos" },
                { valor: "2 sedes", label: "En La Unión" },
              ].map((dato) => (
                <div key={dato.label} className="text-center">
                  <div className="text-3xl font-display font-bold text-gc-gold">{dato.valor}</div>
                  <div className="text-sm text-gc-green-800/50 font-body mt-1">{dato.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/*
            Columna fotos polaroid (order-1 en mobile → va arriba del texto).
            relative z-20 → crea un stacking context global z-20.
              Esto CONTIENE todos los z-index internos (z-9999, z-10000, z-10001)
              dentro de la columna. Como el header es z-50 > z-20, ninguna polaroid
              puede aparecer encima del header, aunque internamente usen z arbitrario.
            lg:sticky lg:top-24 → sticky en desktop a 96px del top (deja ~16px bajo navbar h-20).
              No sticky en mobile (galería fluye con el documento).
            lg:mt-6 → baja la galería ~24px en desktop para alinearla visualmente
              con el párrafo de texto (la sección header ya tiene mb-16 = 64px,
              quedando ~88px de separación total título→galería).
          */}
          <div className="order-1 lg:order-2 relative z-20 lg:sticky lg:top-24 lg:mt-6">
            <GaleriaPolaroid fotos={fotos} lightboxMode="inline" />
          </div>

        </div>
      </div>

      {/* Sellos educativos */}
      {sellos.length > 0 && (
        <div className="mt-16 lg:mt-24 border-t border-gc-gray-200 pt-12 lg:pt-16">
          <div className="text-center mb-4">
            <span className="badge-gold mb-4 inline-block">Lo que nos distingue</span>
            <h2 className="section-heading">Sellos Educativos</h2>
            <p className="section-subheading mx-auto mt-4">
              Tres pilares que definen nuestra propuesta formativa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {sellos.map((sello) => (
              <InfoCard
                key={sello.titulo}
                title={sello.titulo}
                description={sello.descripcion}
                icon={iconMap[sello.icono] ?? iconMap["globe"]}
                accent="gold"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
