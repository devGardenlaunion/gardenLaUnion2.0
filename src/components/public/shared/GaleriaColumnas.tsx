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
  const thumbRafRef = useRef<number | null>(null);

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
        if (fsPromise instanceof Promise) {
          fsPromise
            .then(() => (screen.orientation as any)?.lock?.("landscape").catch(() => {}))
            .catch(() => {
              // Fullscreen rechazado (Opera, policy restrictions) — sugerir rotar manualmente
              setRotateHintShow(true);
              setTimeout(() => setRotateHintVisible(true), 50);
              setTimeout(() => setRotateHintVisible(false), 2800);
              setTimeout(() => setRotateHintShow(false), 3600);
            });
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

  // Thumbnail strip — inertia drag on mobile.
  // Long-tap activa gestos del browser (guardar imagen, menú contextual) que roban el
  // touch y cortan el scroll. touch-action:none lo desactiva; la inertia manual
  // hace que el desplazamiento sea proporcional a la velocidad del arrastre.
  const lbOpen = lbIndex >= 0;
  useEffect(() => {
    if (!lbOpen || !isMobile || !showThumbnails) return;

    let track: HTMLElement | null = null;
    let vel = 0;        // px/ms acumulado via EMA
    let lastX = 0;
    let lastT = 0;
    let dragging = false;
    let attempts = 0;
    let mounted = true;
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    const cancelRaf = () => {
      if (thumbRafRef.current !== null) {
        cancelAnimationFrame(thumbRafRef.current);
        thumbRafRef.current = null;
      }
    };

    const runInertia = () => {
      if (!track) return;
      vel *= 0.92;                                    // fricción — 0.92 ≈ 400ms deslizando a vel máxima
      if (Math.abs(vel) < 0.4) { thumbRafRef.current = null; return; }
      track.scrollLeft += vel;
      thumbRafRef.current = requestAnimationFrame(runInertia);
    };

    const onStart = (e: TouchEvent) => {
      cancelRaf();
      dragging = true;
      lastX = e.touches[0].clientX;
      lastT = performance.now();
      vel = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging || !track) return;
      e.stopPropagation();                            // evita que el lightbox interprete el drag como swipe
      const now = performance.now();
      const dx = lastX - e.touches[0].clientX;       // positivo = arrastra hacia la izquierda
      const dt = Math.max(now - lastT, 1);
      vel = vel * 0.4 + (dx / dt) * 0.6;             // EMA: pondera más las muestras recientes
      track.scrollLeft += dx;
      lastX = e.touches[0].clientX;
      lastT = now;
    };

    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      vel *= 16;                                      // escala px/ms → px/frame a 60fps
      thumbRafRef.current = requestAnimationFrame(runInertia);
    };

    const noCtx = (e: Event) => e.preventDefault();

    const attach = (): boolean => {
      track = document.querySelector(".yarl__thumbnails_track") as HTMLElement | null;
      if (!track) return false;

      track.style.touchAction = "none";               // desactiva gestos nativos del browser en este elemento
      (track.style as any).webkitUserSelect = "none";
      track.style.userSelect = "none";

      track.addEventListener("touchstart", onStart, { passive: true });
      track.addEventListener("touchmove", onMove, { passive: true });
      track.addEventListener("touchend", onEnd, { passive: true });
      track.addEventListener("contextmenu", noCtx);

      track.querySelectorAll("img").forEach((img) => {
        img.addEventListener("contextmenu", noCtx);
        (img.style as any).webkitTouchCallout = "none";
        img.draggable = false;
      });

      return true;
    };

    const tryAttach = () => {
      if (!mounted) return;
      if (!attach() && attempts++ < 8) pendingTimeout = setTimeout(tryAttach, 80);
    };
    tryAttach();

    return () => {
      mounted = false;
      if (pendingTimeout) clearTimeout(pendingTimeout);
      cancelRaf();
      if (!track) return;
      track.removeEventListener("touchstart", onStart);
      track.removeEventListener("touchmove", onMove);
      track.removeEventListener("touchend", onEnd);
      track.removeEventListener("contextmenu", noCtx);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbOpen, isMobile, showThumbnails]);

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
