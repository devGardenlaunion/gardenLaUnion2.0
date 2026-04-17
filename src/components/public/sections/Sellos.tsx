import InfoCard from "@/components/public/shared/InfoCard";

interface Sello {
  titulo: string;
  descripcion: string;
  icono: string;
}

interface SellosProps {
  sellos: Sello[];
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


export default function Sellos({ sellos }: SellosProps) {
  return (
    <section id="sellos" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <span className="badge-gold mb-4 inline-block">Lo que nos distingue</span>
          <h2 className="section-heading">Sellos Educativos</h2>
          <p className="section-subheading mx-auto mt-4">
            Tres pilares que definen nuestra propuesta formativa
          </p>
        </div>

        {/* Cards */}
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
    </section>
  );
}
