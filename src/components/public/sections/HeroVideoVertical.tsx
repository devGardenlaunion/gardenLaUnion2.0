"use client";

import { useRef, useEffect } from "react";

interface Props {
  sources: { src: string; type: string }[];
  poster?: string;
}

/**
 * Hero vertical de MÓVIL (portrait): loop promocional de fondo, muted y
 * decorativo. A diferencia del HeroVideo horizontal —que queda display:none en
 * portrait y por eso NO se descarga— acá el video SÍ es visible, así que se
 * fuerza el autoplay: en cuanto entra en viewport se reproduce (play() sobre un
 * video muted está permitido en móvil). Se pausa al salir de pantalla o con la
 * pestaña oculta, y respeta prefers-reduced-motion (queda el poster fijo).
 */
export default function HeroVideoVertical({ sources, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Movimiento reducido: no se reproduce ni se descarga (queda el poster).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
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
      className="absolute inset-0 w-full h-full object-cover block landscape:hidden md:hidden"
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
