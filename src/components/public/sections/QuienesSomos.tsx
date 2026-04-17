import GaleriaPolaroid, { FotoPolaroid } from "@/components/public/shared/GaleriaPolaroid";
import InfoCard from "@/components/public/shared/InfoCard";

interface QuienesSomosProps {
  mision: string;
  vision: string;
  resena: string;
  fotos?: FotoPolaroid[];
}

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
}: QuienesSomosProps) {
  return (
    <section id="quienes-somos" className="pt-12 pb-8">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
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
    </section>
  );
}
