import Image from "next/image";

// Imágenes: coloca los archivos en public/media/carousel-cards/<nombre-del-card>/
// Se usan TODAS las imágenes recibidas — el crossfade se ajusta a la cantidad.
// Si no se proveen imágenes se muestra un placeholder visual.
//
// `href` es opcional: sin él la card es puramente visual (se renderiza como
// <div>, sin flecha ni hover de link). Así la usa la sección Sellos.

// Segundos que cada imagen permanece en pantalla (incl. transición).
const SEG_POR_IMAGEN = 3.5;

interface CarouselLinkCardProps {
  href?: string;
  /** Sin title ni label, la card es solo imágenes rotando (sin overlay de texto). */
  title?: string;
  label?: string;
  images?: string[];
  /**
   * "cover" (default): la foto llena la card y se recorta lo que sobra.
   * "contain": la foto se muestra completa (sin recortar), con un fondo
   *   desenfocado de la misma imagen rellenando el espacio sobrante. Útil cuando
   *   las fotos tienen proporciones mixtas y no se quiere recortar ninguna.
   */
  fit?: "cover" | "contain";
  /**
   * Texto alternativo del carrusel.
   *
   * Lo lleva sólo la PRIMERA foto: las demás quedan con alt="" porque están
   * apiladas en el mismo lugar rotando por CSS. Si todas llevaran alt, un lector
   * de pantalla leería N descripciones seguidas de algo que se ve como una sola
   * imagen. Con una basta para que la card no sea invisible ni para Google
   * Imágenes ni para quien no ve la pantalla.
   */
  alt?: string;
  className?: string;
}

/**
 * Genera el keyframe de crossfade para N imágenes.
 *
 * El anterior estaba hardcodeado en globals.css para exactamente 3 slides. Con
 * cantidad variable hay que calcular las ventanas: cada imagen ocupa un "slot"
 * de 100/n del ciclo, con un fade que se solapa con la siguiente para el
 * crossfade. Se emite como <style> junto a la card (un nombre por cantidad).
 */
function keyframesPara(n: number): { nombre: string; css: string } {
  const nombre = `cf-${n}`;
  const slot = 100 / n;
  const fade = Math.min(slot * 0.35, 8);
  const r = (x: number) => Math.round(x * 100) / 100;
  const css = `@keyframes ${nombre}{0%{opacity:0}${r(fade)}%{opacity:1}${r(
    slot
  )}%{opacity:1}${r(slot + fade)}%{opacity:0}100%{opacity:0}}`;
  return { nombre, css };
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
  fit = "cover",
  alt = "",
  className = "",
}: CarouselLinkCardProps) {
  const slides = images;
  const hasImages = slides.length > 0;
  const esLink = !!href;
  const animar = slides.length > 1;
  const hayTexto = !!(title || label);
  const contain = fit === "contain";

  const Wrapper = esLink ? "a" : "div";
  const kf = animar ? keyframesPara(slides.length) : null;
  const duracion = slides.length * SEG_POR_IMAGEN;

  return (
    <Wrapper
      {...(esLink ? { href } : {})}
      className={`rounded-xl overflow-hidden border border-gc-green-100/15 transition-colors block group relative ${
        esLink ? "hover:border-gc-gold/30" : ""
      } ${contain ? "bg-gc-green-900" : ""} ${className}`}
      style={{ minHeight: "160px" }}
    >
      {kf && <style dangerouslySetInnerHTML={{ __html: kf.css }} />}

      {hasImages ? (
        slides.map((src, i) => (
          // Cada slide es un contenedor que se anima (crossfade). En modo
          // "contain" lleva dos capas: fondo desenfocado (cover) + foto completa
          // (contain), para no recortar nada sin dejar barras vacías.
          <div
            key={src}
            className={`absolute inset-0 cf-slide${i === 0 ? " cf-slide-first" : ""}`}
            style={
              animar
                ? {
                    opacity: 0,
                    animation: `${kf!.nombre} ${duracion}s ${
                      -(i * SEG_POR_IMAGEN)
                    }s infinite`,
                  }
                : undefined
            }
          >
            {contain && (
              <>
                <Image
                  src={src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 1024px) 60vw, 360px"
                  className="object-cover scale-110 blur-2xl"
                />
                <div className="absolute inset-0 bg-gc-green-900/30" />
              </>
            )}
            <Image
              src={src}
              alt={i === 0 ? alt : ""}
              aria-hidden={i !== 0 || !alt}
              fill
              /* En object-cover, una foto apaisada en una card alta se muestra
                 mucho más ancha que la card (se recorta): hay que servir esa
                 resolución o Next la sirve chica y se ve pixelada. Antes 360px
                 estiraba ~2.5x las fotos apaisadas de Sellos. */
              sizes="(max-width: 1024px) 95vw, 1024px"
              className={contain ? "object-contain" : "object-cover"}
            />
          </div>
        ))
      ) : (
        <Placeholder />
      )}

      {/* Overlay de texto: solo si hay title/label. Sin texto (p.ej. Admisión)
          la card es imagen pura, sin el fade negro ni la flecha. */}
      {hayTexto && (
        <>
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
              {title && (
                <span className="text-white font-display font-bold text-base leading-tight">
                  {title}
                </span>
              )}
            </div>
            {esLink && (
              <div className="w-9 h-9 rounded-lg bg-gc-gold/20 text-gc-gold-light flex items-center justify-center shrink-0 group-hover:bg-gc-gold/30 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            )}
          </div>
        </>
      )}
    </Wrapper>
  );
}
