import Image from "next/image";
import { shuffle } from "@/lib/utils";

/**
 * Tira compacta de fotos que enlaza a la galería completa.
 *
 * Por qué no reusamos las galerías existentes:
 *  · GaleriaColumnas es masonry con lightbox — arrastra react-photo-album y
 *    yet-another-react-lightbox al cliente. Demasiado peso para 6 miniaturas
 *    cuyo único trabajo es invitar a entrar a la subpágina.
 *  · GaleriaPolaroid tiene una estética muy marcada (corkboard) que ya se usa
 *    en Quiénes Somos. Repetirla acá restaría en vez de sumar.
 *
 * Este componente es Server Component puro: cero JS al cliente. Las fotos no
 * abren lightbox — son links. El destino es la página del evento, que es donde
 * están las 87 fotos de verdad.
 */

interface MicroGaleriaProps {
  fotos: { src: string; caption?: string }[];
  href: string;
  /** Cuántas miniaturas mostrar. Default: 6 */
  cantidad?: number;
  /**
   * Elegir las miniaturas al azar en vez de las primeras.
   *
   * Ojo con el alcance: esto corre en el servidor y la home es estática, así
   * que la selección se congela en el HTML del build y cambia recién en el
   * próximo deploy — no en cada visita. Que sea Server Component es justamente
   * lo que evita un mismatch de hidratación.
   */
  aleatorio?: boolean;
  /** Texto del link al final. Default: "Ver reportaje" */
  cta?: string;
  alt?: string;
  className?: string;
}

export default function MicroGaleria({
  fotos,
  href,
  cantidad = 6,
  aleatorio = false,
  cta = "Ver reportaje",
  alt = "Foto de la actividad",
  className = "",
}: MicroGaleriaProps) {
  const fuente = aleatorio ? shuffle(fotos) : fotos;
  const visibles = fuente.slice(0, cantidad);
  if (visibles.length === 0) return null;

  return (
    <div className={className}>
      {/* 3 columnas en mobile, 6 en desktop → una sola tira pareja */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 lg:gap-3">
        {visibles.map((foto, i) => (
          <a
            key={foto.src}
            href={href}
            className="relative aspect-square rounded-lg overflow-hidden group block"
            aria-label={foto.caption || alt}
          >
            <Image
              src={foto.src}
              alt={foto.caption || alt}
              fill
              sizes="(max-width: 640px) 33vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gc-green-900/0 group-hover:bg-gc-green-900/20 transition-colors" />
          </a>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href={href}
          className="inline-flex items-center gap-2 text-sm font-body font-semibold text-gc-green-800/70 hover:text-gc-green transition-colors"
        >
          {cta}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
