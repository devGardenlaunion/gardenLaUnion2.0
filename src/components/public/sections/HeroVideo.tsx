"use client";

import { useRef, useEffect } from "react";

interface HeroVideoProps {
  /** Fuentes del video, en orden de preferencia. Cada una lleva su MIME. */
  sources: { src: string; type: string }[];
  poster?: string;
}

export default function HeroVideo({ sources, poster }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respeta reduced-motion: no reproduce (queda el poster). Y como no hay
    // autoPlay + preload="none", tampoco descarga el video.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // El observer sólo dispara play cuando el video es VISIBLE. En móvil portrait
    // el <video> está display:none (se muestra la imagen del hero), así que nunca
    // entra en viewport → nunca se descarga. Ese era el 2.8MB que cargaba de más.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sources]);

  if (sources.length === 0) return null;

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      aria-hidden="true"
      /* object-contain: el video (cine 2.35:1) llena el ANCHO del contenedor y
         el alto queda proporcional; el bg-black rellena lo que sobra arriba y
         abajo con barras negras. Centrado vertical por defecto en object-contain. */
      className="absolute inset-0 w-full h-full object-contain bg-black translate-y-[3px] hidden landscape:block md:block"
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
