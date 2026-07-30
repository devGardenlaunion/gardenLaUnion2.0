import InfoCard from "@/components/public/shared/InfoCard";
import CarouselLinkCard from "@/components/public/shared/CarouselLinkCard";

interface Cta {
  cifra: string;
  texto: string;
  boton: string;
  href: string;
}

interface SelloCard {
  titulo: string;
  descripcion: string;
  icono: string;
}

interface SellosProps {
  titulo: string;
  descripcion: string;
  cta: Cta | null;
  cards: SelloCard[];
  imagenesCarrusel?: string[];
}

const IMAGENES_SELLOS = [
  "/media/carousel-cards/convivencia/foto-1.webp",
  "/media/carousel-cards/convivencia/foto-2.webp",
  "/media/carousel-cards/convivencia/foto-3.webp",
];

/**
 * Mosaico: cada posición del array `cards` recibe un ancho distinto.
 * La primera es la destacada (ocupa 4 de 6 columnas), el carrusel se inserta
 * a su derecha ocupando dos filas, y el resto se acomoda alrededor:
 *
 *   [ card 0        (4) ][ carrusel (2) ]
 *   [ card 1 (2)][ c2 (2)][     ↑       ]
 *   [ card 3   (3) ][ card 4     (3)    ]
 *
 * Si algún día hay más de 5 cards, las extra caen en 3 columnas (media fila).
 */
const SPANS = [
  "lg:col-span-4",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
];
const SPAN_EXTRA = "lg:col-span-3";

const iconMap: Record<string, JSX.Element> = {
  "heart-pulse": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  "book-open": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  "shield-check": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
};

export default function Sellos({
  titulo,
  descripcion,
  cta,
  cards,
  imagenesCarrusel = IMAGENES_SELLOS,
}: SellosProps) {
  const [destacada, ...resto] = cards;

  return (
    <section id="sellos" className="pt-12 pb-8">
      <div className="container-gc">
        {/* Tarjeta continua — overflow-hidden aplica radius a todos los hijos */}
        <div className="rounded-2xl overflow-hidden shadow-2xl">

          {/*
            ── BLOQUE 1: DECLARACIÓN + MOSAICO ──
            Van en el MISMO contenedor a propósito. Cuando eran dos divs
            hermanos con el mismo verde, el de arriba tenía overflow-hidden y un
            glow apoyado en su borde inferior (bottom-0 right-0): el glow se
            cortaba en seco justo en la juntura y aparecía una banda más clara a
            la derecha. Fusionados, el fondo es continuo y el aire entre el
            párrafo y el mosaico se controla con un solo margen.
          */}
          <div className="relative bg-gc-green-800 overflow-hidden px-6 pt-12 sm:pt-16 lg:pt-20 pb-10 lg:pb-14">
            {/* Patrón de puntos */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "28px 28px",
              }}
            />
            {/* Glow decorativo dorado */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-gc-gold/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gc-green-900/50 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative max-w-3xl mx-auto text-center">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gc-gold/20 text-gc-gold-light text-sm font-semibold rounded-full border border-gc-gold/20 mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                Lo que nos distingue
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
                {titulo}
              </h2>
              <p className="text-lg text-gc-green-100/80 font-body leading-relaxed">
                {descripcion}
              </p>
            </div>

            {cards.length > 0 && (
              <div className="relative">
                {/*
                  Hilo dorado corto que baja del párrafo al label: ata el mosaico
                  a la declaración para que se lea como "y así lo hacemos", no
                  como un tema nuevo. El espacio total párrafo→mosaico es
                  deliberadamente corto — con más aire se leía como otra sección.
                */}
                <div className="flex flex-col items-center mt-8 lg:mt-10 mb-5 lg:mb-6">
                  <div
                    className="w-px h-6"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(197,168,53,0), rgba(197,168,53,0.6))",
                    }}
                    aria-hidden
                  />
                  <p className="mt-3 text-center text-xs font-body font-semibold text-gc-green-100/60 uppercase tracking-widest">
                    Cómo lo vivimos
                  </p>
                </div>

                {/*
                  auto-rows-fr → todas las filas de igual alto, para que el
                  carrusel (row-span-2) calce exacto con las dos filas de cards
                  de su izquierda. En mobile y tablet el mosaico se desarma en
                  una sola columna.
                */}
                <div className="grid gap-4 lg:gap-5 lg:grid-cols-6 lg:auto-rows-fr max-w-5xl mx-auto">
                  {destacada && (
                    <InfoCard
                      key={destacada.titulo}
                      title={destacada.titulo}
                      description={destacada.descripcion}
                      icon={iconMap[destacada.icono] ?? iconMap["sparkles"]}
                      accent="gold"
                      variant="dark"
                      className={`h-full ${SPANS[0]}`}
                    />
                  )}

                  {/* Card visual: mismo formato de antes, ya sin link */}
                  <CarouselLinkCard
                    title="Nuestra comunidad"
                    label="Así se ve un día en Garden"
                    images={imagenesCarrusel}
                    alt="Un día en Garden College, La Unión — actividades de la comunidad escolar"
                    /* Ciclo 2 (expresiva): marco de altura fija en móvil (4:3,
                       object-cover) para que no salte el scroll; en desktop
                       manda el grid (col-span-2 row-span-2), sin cambios. */
                    className="aspect-[4/3] lg:aspect-auto lg:col-span-2 lg:row-span-2"
                  />

                  {resto.map((card, i) => (
                    <InfoCard
                      key={card.titulo}
                      title={card.titulo}
                      description={card.descripcion}
                      icon={iconMap[card.icono] ?? iconMap["sparkles"]}
                      accent="gold"
                      variant="dark"
                      className={`h-full ${SPANS[i + 1] ?? SPAN_EXTRA}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BLOQUE 3: CTA DE CIERRE ── */}
          {cta && (
            <div className="bg-gc-green-900 border-l-4 border-gc-gold px-6 py-8 lg:py-10">
              <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-center sm:text-left">
                <div className="text-5xl lg:text-6xl font-display font-bold text-gc-gold leading-none shrink-0">
                  {cta.cifra}
                </div>
                <p className="text-gc-green-100/80 font-body text-lg leading-relaxed">
                  {cta.texto}
                </p>
                <a
                  href={cta.href}
                  className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gc-gold text-gc-green-900 font-body font-semibold rounded-xl hover:bg-gc-gold-light transition-colors duration-200"
                >
                  {cta.boton}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
