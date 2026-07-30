import HeroVideo from "./HeroVideo";
import HeroVideoVertical from "./HeroVideoVertical";

interface HeroProps {
  nombre: string;
  slogan: string;
  mision: string;
  imagenMobile?: string;
  videoSources?: { src: string; type: string }[];
  videoSourcesVert?: { src: string; type: string }[];
  videoPoster?: string;
}

export default function Hero({
  nombre,
  slogan,
  mision,
  imagenMobile,
  videoSources = [],
  videoSourcesVert = [],
  videoPoster,
}: HeroProps) {
  return (
    <section
      id="inicio"
      className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background — video (desktop + landscape) */}
      <HeroVideo sources={videoSources} poster={videoPoster} />

      {/* Background — imagen fija (mobile portrait).
          Es el LCP en celular, que es como llega la mayoría: va con
          fetchPriority alto para que el navegador la pida antes que el resto.
          Si no hay imagen no se renderiza nada: el degradado ya cubre el fondo
          y un <img> roto costaría una petición 404 en la ruta crítica. */}
      {imagenMobile && (
        <img
          src={imagenMobile}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover block landscape:hidden md:hidden"
        />
      )}

      {/* Loop promocional vertical (mobile portrait). Se superpone a la imagen:
          el <img> de arriba es el LCP instantáneo y el video la cubre al
          reproducirse. ~2-3MB, es un costo aceptado a propósito para el fondo. */}
      <HeroVideoVertical sources={videoSourcesVert} poster={videoPoster} />

      {/* Scrim radial: verde de marca sobre el centro (donde va el texto y el
          video), transparente en los bordes para que las barras del letterbox
          queden NEGRAS y no verdes. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 58% at center, rgba(20,56,50,0.78), rgba(20,56,50,0.30) 62%, transparent 85%)",
        }}
      />

      {/* Patrón decorativo sutil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Acento dorado decorativo */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gc-gold/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gc-gold/5 blur-3xl -translate-x-1/2 translate-y-1/2" />

      {/* Contenido */}
      <div className="relative container-gc text-center py-20 sm:py-24 lg:py-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8">
          <div className="w-2 h-2 rounded-full bg-gc-green animate-pulse" />
          <span className="text-white/80 text-sm font-body">
            Desde 2004 en La Unión, Región de Los Ríos
          </span>
        </div>

        {/* Título */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold text-white mb-6 tracking-tight">
          {nombre}
        </h1>

        {/* Línea dorada decorativa */}
        <div className="w-24 h-1 bg-gc-green mx-auto mb-6 rounded-full" />

        {/* Slogan */}
        <p className="text-xl sm:text-2xl lg:text-3xl text-gc-gold-light font-display font-medium mb-8">
          {slogan}
        </p>

        {/* Descripción breve */}
        <p className="text-white/70 font-body text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Educación integral con énfasis en inglés, vida saludable y valores
          cristianos. Prebásica a 4° Medio.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#admision" className="btn-primary text-lg px-8 py-4">
            Proceso de Admisión
          </a>
          <a
            href="#quienes-somos"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-body font-medium transition-colors group"
          >
            Conoce nuestro colegio
            <svg
              className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Onda inferior — SOLO móvil portrait. En desktop/landscape el video es
          cine con object-contain y la onda tapaba el borde inferior del video
          (recorte de ~0.5cm en la última escena). En móvil el video vertical
          llena la pantalla, así que la onda sí hace de transición. */}
      <div className="absolute bottom-0 left-0 right-0 block landscape:hidden md:hidden">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120V60C240 20 480 0 720 20C960 40 1200 80 1440 60V120H0Z"
            fill="var(--gc-warm, #FAFAF8)"
          />
        </svg>
      </div>
    </section>
  );
}
