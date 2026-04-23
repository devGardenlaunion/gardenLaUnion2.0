import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MultimediaItem, EdicionMinima } from "@/components/public/shared/EventModal";

export type EventoMinimo = {
  id: string;
  nombre: string;
  slug: string;
  recurrencia: string;
};

export type EdicionCard = {
  id: string;
  titulo: string;
  slug: string;
  extracto: string;
  contenido: string;
  imagenPortada: string | null;
  fecha: string;
  destacada: boolean;
  evento: EventoMinimo & { ediciones: EdicionMinima[] };
  multimedia: MultimediaItem[];
};

// Fondos alternativos cuando no hay imagen
const cardBgs = [
  "from-gc-green-800 to-gc-green-900",
  "from-gc-green-dark to-gc-green-800",
  "from-gc-green-900 to-gc-green-800",
];

interface EventosWrapperProps {
  heroEdicion: EdicionCard | null;
  gridEdiciones: EdicionCard[];
  todosEventos: EventoMinimo[];
  titulo: string;
  subtitulo: string;
  badge: string;
}

export default function EventosWrapper({
  heroEdicion,
  gridEdiciones,
  titulo,
  subtitulo,
  badge,
}: EventosWrapperProps) {
  if (!heroEdicion && gridEdiciones.length === 0) return null;

  return (
    <section id="eventos" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="badge-gold mb-4 inline-block">{badge}</span>
          <h2 className="section-heading">{titulo}</h2>
          <p className="section-subheading mx-auto mt-4">{subtitulo}</p>
        </div>

        {/* Hero event */}
        {heroEdicion && (
          <a
            href={`/eventos/${heroEdicion.slug}`}
            className="w-full text-left mb-6 lg:mb-8 group block"
          >
            <div className="relative rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[400px] flex items-end">
              {heroEdicion.imagenPortada ? (
                <img
                  src={heroEdicion.imagenPortada}
                  alt={heroEdicion.titulo}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gc-green-900 via-gc-green-800 to-gc-green-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gc-green-900/90 via-gc-green-900/30 to-transparent" />
              <div className="relative p-6 lg:p-10 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 bg-gc-gold/20 text-gc-gold-light text-xs font-semibold rounded-full backdrop-blur-sm border border-gc-gold/20">
                    {heroEdicion.evento.nombre} · {format(new Date(heroEdicion.fecha), "yyyy", { locale: es })}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white mb-3 leading-tight max-w-3xl">
                  {heroEdicion.titulo}
                </h3>
                <time className="text-white/60 text-sm font-body block mb-4">
                  {format(new Date(heroEdicion.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                </time>
                <p className="text-white/80 font-body text-base max-w-2xl mb-6 leading-relaxed line-clamp-2">
                  {heroEdicion.extracto}
                </p>
                <span className="btn-primary text-sm">
                  Ver evento
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>
          </a>
        )}

        {/* Grid de 3 */}
        {gridEdiciones.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10 lg:mb-14">
            {gridEdiciones.map((edicion, i) => (
              <a
                key={edicion.id}
                href={`/eventos/${edicion.slug}`}
                className="text-left group block"
              >
                <div className="card h-full">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {edicion.imagenPortada ? (
                      <img
                        src={edicion.imagenPortada}
                        alt={edicion.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${cardBgs[i % cardBgs.length]} flex items-center justify-center`}>
                        <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gc-green-800 text-xs font-body font-semibold rounded-md">
                        {edicion.evento.nombre}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 lg:p-5">
                    <time className="text-xs text-gc-green-800/40 font-body">
                      {format(new Date(edicion.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                    </time>
                    <h3 className="text-base font-display font-bold text-gc-green-800 mt-1 mb-2 line-clamp-2 group-hover:text-gc-green transition-colors">
                      {edicion.titulo}
                    </h3>
                    <p className="text-gc-green-800/60 font-body text-sm leading-relaxed line-clamp-2">
                      {edicion.extracto}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
