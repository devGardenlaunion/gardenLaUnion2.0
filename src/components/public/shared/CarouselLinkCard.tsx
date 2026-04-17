// Imágenes: coloca los archivos en public/media/carousel-cards/<nombre-del-card>/
// Las primeras 3 imágenes del array se usan; el resto se ignora.
// Si no se proveen imágenes se muestra un placeholder visual.
// El keyframe "carousel-fade" está definido en globals.css (ciclo 9s, 3 imágenes).

const DELAYS = ["0s", "-6s", "-3s"] as const;

interface CarouselLinkCardProps {
  href: string;
  title: string;
  label?: string;
  images?: string[];
  className?: string;
}

function Placeholder() {
  return (
    <div className="absolute inset-0 bg-gc-green-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 opacity-30">
        <svg className="w-8 h-8 text-gc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M3 9.75A.75.75 0 013.75 9h16.5a.75.75 0 01.75.75v9a.75.75 0 01-.75.75H3.75A.75.75 0 013 18.75V9.75z" />
        </svg>
        <span className="text-gc-green-100 text-xs font-body">Agregar imágenes</span>
      </div>
    </div>
  );
}

export default function CarouselLinkCard({
  href,
  title,
  label,
  images = [],
  className = "",
}: CarouselLinkCardProps) {
  const slides = images.slice(0, 3);
  const hasImages = slides.length > 0;

  return (
    <a
      href={href}
      className={`rounded-xl overflow-hidden border border-gc-green-100/15 hover:border-gc-gold/30 transition-colors block group relative ${className}`}
      style={{ minHeight: "160px" }}
    >
      {hasImages ? (
        slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: `carousel-fade 9s ${DELAYS[i]} infinite` }}
          />
        ))
      ) : (
        <Placeholder />
      )}

      {/* Fade negro garantizado sobre la foto */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent" />

      {/* Texto + flecha */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
        <div>
          {label && (
            <p className="text-gc-green-100/55 font-body text-xs mb-1 leading-snug">
              {label}
            </p>
          )}
          <span className="text-white font-display font-bold text-base leading-tight">
            {title}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-gc-gold/20 text-gc-gold-light flex items-center justify-center shrink-0 group-hover:bg-gc-gold/30 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </a>
  );
}
