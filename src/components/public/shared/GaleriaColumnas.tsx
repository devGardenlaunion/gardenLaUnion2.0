"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ColumnsPhotoAlbum } from "react-photo-album";
import SSR from "react-photo-album/ssr";
import "react-photo-album/columns.css";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export interface FotoColumnas {
  src: string;
  width: number;
  height: number;
  alt: string;
  poster?: string;
  sources?: { src: string; type: string }[];
}

interface GaleriaColumnasProps {
  fotos: FotoColumnas[];
  spacing?: number;
  columns?: (containerWidth: number) => number;
  showThumbnails?: boolean;
  className?: string;
}

const VIDEO_RE = /\.(mp4|webm|mov)$/i;
const isVideo = (src: string) => VIDEO_RE.test(src);

function getMimeType(src: string): string {
  if (/\.webm$/i.test(src)) return "video/webm";
  if (/\.mov$/i.test(src)) return "video/quicktime";
  return "video/mp4";
}

function defaultColumns(w: number) {
  if (w < 640) return 2;
  return 3;
}

export default function GaleriaColumnas({
  fotos,
  spacing = 10,
  columns = defaultColumns,
  showThumbnails = true,
  className,
}: GaleriaColumnasProps) {
  const [lbIndex, setLbIndex] = useState(-1);
  const [loadedCount, setLoadedCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [thumbPos, setThumbPos] = useState<"bottom" | "start">("bottom");
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosHintShow, setIosHintShow] = useState(false);
  const [iosHintVisible, setIosHintVisible] = useState(false);
  const [rotateHintShow, setRotateHintShow] = useState(false);
  const [rotateHintVisible, setRotateHintVisible] = useState(false);
  const thumbDragCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    // Detectar móvil una sola vez — estable a través de cambios de orientación.
    // maxTouchPoints > 0 es más confiable que innerWidth porque no varía al rotar.
    const mobile = navigator.maxTouchPoints > 0;
    setIsMobile(mobile);
    setThumbPos(mobile ? "start" : "bottom");
  }, []);

  // Fullscreen automático al abrir el lightbox — solo en móvil
  useEffect(() => {
    if (lbIndex >= 0) {
      if (isMobile && !isIOS) {
        // requestFullscreen puede no existir (Opera mobile, algunos browsers)
        // Si ?.() devuelve undefined no encadenar .then/.catch — TypeError silencioso
        const fsPromise = document.documentElement.requestFullscreen?.();
        const showRotateHint = () => {
          setRotateHintShow(true);
          setTimeout(() => setRotateHintVisible(true), 50);
          setTimeout(() => setRotateHintVisible(false), 2800);
          setTimeout(() => setRotateHintShow(false), 3600);
        };
        if (fsPromise instanceof Promise) {
          fsPromise
            .then(() => {
              // Fullscreen OK — ahora intentar bloquear orientación a landscape
              const lockPromise = (screen.orientation as any)?.lock?.("landscape");
              if (lockPromise instanceof Promise) {
                lockPromise.catch(showRotateHint); // lock rechazado (Opera, Firefox mobile)
              } else {
                showRotateHint(); // API no disponible
              }
            })
            .catch(showRotateHint); // fullscreen rechazado
        } else {
          // API no disponible — mostrar hint igualmente
          setRotateHintShow(true);
          const t1 = setTimeout(() => setRotateHintVisible(true), 50);
          const t2 = setTimeout(() => setRotateHintVisible(false), 2800);
          const t3 = setTimeout(() => setRotateHintShow(false), 3600);
          return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
      } else if (isIOS && isMobile) {
        setIosHintShow(true);
        const t1 = setTimeout(() => setIosHintVisible(true), 50);
        const t2 = setTimeout(() => setIosHintVisible(false), 2800);
        const t3 = setTimeout(() => setIosHintShow(false), 3600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
      }
    } else {
      (screen.orientation as any)?.unlock?.();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }, [lbIndex, isMobile, isIOS]);

  // Drag-to-scroll en la tira de miniaturas —————————————————————————————————
  // yarl captura todos los pointer events en su root para swipe de navegación,
  // por lo que el thumbnail container nunca los recibe de forma natural.
  // Solución: interceptar en el container y llamar stopPropagation() solo cuando
  // el gesto es en el eje de la tira (vertical para "start", horizontal para "bottom").
  // Un umbral de 5 px evita bloquear taps normales sobre las miniaturas.
  useEffect(() => {
    if (!showThumbnails || lbIndex < 0) {
      thumbDragCleanup.current?.();
      thumbDragCleanup.current = null;
      return;
    }

    const timer = setTimeout(() => {
      const tc = document.querySelector<HTMLElement>(".yarl__thumbnails_container");
      if (!tc) return;

      const vertical = thumbPos === "start";
      let sx = 0, sy = 0, ss = 0, active = false;

      const onDown = (e: PointerEvent) => {
        sx = e.clientX; sy = e.clientY;
        ss = vertical ? tc.scrollTop : tc.scrollLeft;
        active = true;
      };
      const onMove = (e: PointerEvent) => {
        if (!active) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        const primary = vertical ? Math.abs(dy) : Math.abs(dx);
        const secondary = vertical ? Math.abs(dx) : Math.abs(dy);
        if (primary > 5 && primary > secondary) {
          e.stopPropagation();
          if (vertical) tc.scrollTop = ss - dy;
          else tc.scrollLeft = ss - dx;
        }
      };
      const onUp = () => { active = false; };

      tc.addEventListener("pointerdown", onDown);
      tc.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      thumbDragCleanup.current = () => {
        tc.removeEventListener("pointerdown", onDown);
        tc.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, 150);

    return () => {
      clearTimeout(timer);
      thumbDragCleanup.current?.();
      thumbDragCleanup.current = null;
    };
  }, [lbIndex, showThumbnails, thumbPos]);

  // Only show items that have a visual: pure images or videos with a poster
  const displayFotos = fotos.filter((f) => !isVideo(f.src) || !!f.poster);

  // Every item in displayFotos renders a <Image>, so imageCount === displayFotos.length
  const imageCount = displayFotos.length;
  const pct = imageCount > 0 ? Math.round((loadedCount / imageCount) * 100) : 100;
  const allLoaded = pct >= 100;

  // Hide toast shortly after all images finish loading
  useEffect(() => {
    if (allLoaded && imageCount > 0 && mounted) {
      const t = setTimeout(() => setToastVisible(false), 1800);
      return () => clearTimeout(t);
    }
  }, [allLoaded, imageCount, mounted]);

  // Failsafe: force-complete after 8 s (slow network / broken images)
  useEffect(() => {
    if (!allLoaded && mounted && imageCount > 0) {
      const t = setTimeout(() => setLoadedCount(imageCount), 8000);
      return () => clearTimeout(t);
    }
  }, [allLoaded, imageCount, mounted]);

  const handleImageLoad = useCallback(() => {
    setLoadedCount((prev) => Math.min(prev + 1, imageCount));
  }, [imageCount]);

  if (fotos.length === 0) {
    return (
      <p className="text-center text-gc-gray-500 font-body py-8">
        No hay fotos disponibles aún.
      </p>
    );
  }

  // Map poster URL → original video src so render.image can detect video thumbnails
  const videoByPoster = new Map<string, string>(
    displayFotos
      .filter((f) => isVideo(f.src) && f.poster)
      .map((f) => [f.poster!, f.src])
  );

  // Album shows poster instead of the raw video src
  const albumPhotos = displayFotos.map((f) =>
    isVideo(f.src) && f.poster ? { ...f, src: f.poster } : f
  );

  // Lightbox slides for all display items — images and video slides
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lightboxSlides: any[] = displayFotos.map((f) => {
    if (isVideo(f.src)) {
      return {
        type: "video",
        sources: f.sources ?? [{ src: f.src, type: getMimeType(f.src) }],
        ...(f.poster && { poster: f.poster }),
        width: f.width,
        height: f.height,
      };
    }
    return { src: f.src, width: f.width, height: f.height, alt: f.alt };
  });

  return (
    <div className={className}>
      {/* [&_.react-photo-album--track]:!justify-start fixes uneven vertical gaps:
          react-photo-album uses justify-content:space-between per column, which
          stretches gaps in shorter columns. flex-start keeps uniform row-gap. */}
      <div className="[&_.react-photo-album--track]:!justify-start">
      <SSR breakpoints={[375, 640, 1200]}>
        <ColumnsPhotoAlbum
          photos={albumPhotos}
          spacing={spacing}
          columns={columns}
          onClick={({ index }) => setLbIndex(index)}
          render={{
            image: ({ src, alt, width, height, sizes, loading, style }) => {
              const videoSrc = videoByPoster.get(src ?? "");

              if (videoSrc) {
                // Poster image + play button overlay — looks like a photo, acts like a video
                return (
                  <div
                    className="relative group overflow-hidden rounded-lg cursor-pointer"
                    style={{ ...(style as React.CSSProperties), position: "relative" }}
                  >
                    <Image
                      src={src!}
                      alt="Vista previa de video"
                      width={typeof width === "number" ? width : 1920}
                      height={typeof height === "number" ? height : 1080}
                      sizes={sizes ?? "(max-width: 640px) 50vw, 33vw"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading={loading ?? "lazy"}
                      onLoad={handleImageLoad}
                    />
                    {/* Play button — pointer-events-none so the parent handles click */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/55 backdrop-blur-[2px] rounded-full flex items-center justify-center border-2 border-white/75 shadow-xl transition-transform duration-200 group-hover:scale-110">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Image
                  src={src!}
                  alt={alt ?? "Galería Garden College"}
                  width={typeof width === "number" ? width : 1200}
                  height={typeof height === "number" ? height : 800}
                  sizes={sizes ?? "(max-width: 640px) 50vw, 33vw"}
                  style={style}
                  loading={loading ?? "lazy"}
                  className="rounded-lg cursor-pointer object-cover hover:brightness-90 transition-[filter,transform] duration-300 hover:scale-[1.01]"
                  onLoad={handleImageLoad}
                />
              );
            },
          }}
        />
      </SSR>
      </div>

      {/* Lightbox — prev/next navigate images AND videos seamlessly */}
      <Lightbox
        open={lbIndex >= 0}
        index={lbIndex}
        close={() => setLbIndex(-1)}
        slides={lightboxSlides}
        on={{ view: ({ index }) => setLbIndex(index) }}
        video={{ autoPlay: true, playsInline: true, preload: "auto" }}
        styles={{
          container: {
            backgroundColor: "rgba(17, 24, 39, 0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          },
        }}
        plugins={showThumbnails ? [Thumbnails, Video] : [Video]}
        thumbnails={{
          position: thumbPos,
          width: 80,
          height: 60,
          border: 2,
          borderRadius: 6,
          padding: 4,
          gap: 8,
        }}
      />

      {/* Loading toast — aparece mientras cargan las imágenes, desaparece al terminar */}
      {mounted && toastVisible && imageCount > 0 && (
        <div
          className={`fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border text-sm font-body transition-colors duration-300 ${
            allLoaded
              ? "bg-gc-green border-gc-green/30 text-white animate-pulse"
              : "bg-white/95 border-gc-green-100 text-gc-green-800 backdrop-blur-sm"
          }`}
        >
          {allLoaded ? (
            <>
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Galería lista</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 shrink-0 animate-spin text-gc-green"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Cargando galería</span>
              <div className="w-16 h-1.5 bg-gc-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gc-green rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-gc-green-800/50 text-xs w-7 text-right tabular-nums">{pct}%</span>
            </>
          )}
        </div>
      )}
      {/* Aviso iOS — pantalla completa no disponible */}
      {iosHintShow && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 bg-black/75 text-white/90 text-xs rounded-full backdrop-blur-sm whitespace-nowrap pointer-events-none transition-opacity duration-700 ${
            iosHintVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          Pantalla completa no disponible en iOS — limitación del navegador
        </div>
      )}
      {/* Aviso rotate — pantalla completa no soportada por el browser (Opera, etc.) */}
      {rotateHintShow && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-2 px-4 py-2 bg-black/75 text-white/90 text-xs rounded-full backdrop-blur-sm whitespace-nowrap pointer-events-none transition-opacity duration-700 ${
            rotateHintVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Gira el dispositivo · Diseñado para modo horizontal
        </div>
      )}
    </div>
  );
}
