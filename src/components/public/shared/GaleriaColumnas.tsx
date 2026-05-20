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

// ─── Strip de thumbnails mobile ──────────────────────────────────────────────
// Ventana deslizante de WINDOW_SIZE fotos + flechas arriba/abajo.
// Solo se monta en mobile; desktop usa el plugin Thumbnails de YARL.
const WINDOW_SIZE = 5;

interface MobileThumbStripProps {
  photos: FotoColumnas[];
  activeIndex: number;
  windowStart: number;
  onSelect: (index: number) => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

function MobileThumbStrip({
  photos,
  activeIndex,
  windowStart,
  onSelect,
  onScrollUp,
  onScrollDown,
}: MobileThumbStripProps) {
  const total = photos.length;
  const canUp = windowStart > 0;
  const canDown = windowStart + WINDOW_SIZE < total;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center gap-2 select-none z-10"
      style={{ width: 68 }}
    >
      {/* Flecha arriba — fade cuando no hay más fotos */}
      <button
        onClick={canUp ? onScrollUp : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          canUp ? "opacity-90 active:scale-90" : "opacity-20 pointer-events-none"
        }`}
        aria-label="Anteriores"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Ventana de WINDOW_SIZE thumbnails */}
      {Array.from({ length: WINDOW_SIZE }, (_, i) => {
        const globalIdx = windowStart + i;
        if (globalIdx >= total) return null;
        const photo = photos[globalIdx];
        const src = isVideo(photo.src) && photo.poster ? photo.poster : photo.src;
        const isActive = globalIdx === activeIndex;

        return (
          <button
            key={globalIdx}
            onClick={() => onSelect(globalIdx)}
            className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              isActive
                ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)] scale-105"
                : "border-white/25 opacity-55 active:opacity-90 active:scale-95"
            }`}
            style={{ width: 52, height: 52 }}
            aria-label={`Imagen ${globalIdx + 1}`}
            aria-pressed={isActive}
          >
            <Image
              src={src}
              alt={photo.alt}
              fill
              sizes="52px"
              className="object-cover"
              style={{ pointerEvents: "none" }}
            />
            {isVideo(photo.src) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      {/* Flecha abajo — fade cuando no hay más fotos */}
      <button
        onClick={canDown ? onScrollDown : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          canDown ? "opacity-90 active:scale-90" : "opacity-20 pointer-events-none"
        }`}
        aria-label="Siguientes"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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
  // Ventana deslizante del strip mobile: índice global del primer thumb visible
  const [windowStart, setWindowStart] = useState(0);
  const videoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Only show items that have a visual: pure images or videos with a poster
  const displayFotos = fotos.filter((f) => !isVideo(f.src) || !!f.poster);

  // Sincroniza la ventana con lbIndex: el thumb activo siempre queda visible.
  // Rango máximo dentro de la ventana: posición 0 → WINDOW_SIZE-1 (salto i=0 a i=4).
  useEffect(() => {
    if (lbIndex < 0) return;
    setWindowStart((prev) => {
      if (lbIndex < prev) return lbIndex;                              // subió fuera de la ventana
      if (lbIndex >= prev + WINDOW_SIZE) return lbIndex - WINDOW_SIZE + 1; // bajó fuera de la ventana
      return prev;                                                     // ya está dentro
    });
  }, [lbIndex]);

  // Autoplay con delay al llegar a un slide de video.
  // Identifica el <video> por src exacto para no reproducir slides adyacentes.
  useEffect(() => {
    if (videoPlayRef.current) {
      clearTimeout(videoPlayRef.current);
      videoPlayRef.current = null;
    }
    // Pausa todo al navegar (evita audio de slides no visibles)
    document.querySelectorAll(".yarl__root video").forEach((v) =>
      (v as HTMLVideoElement).pause()
    );
    if (lbIndex < 0) return;
    const foto = displayFotos[lbIndex];
    if (!foto || !isVideo(foto.src)) return;

    const targetSrc = foto.sources?.[0]?.src ?? foto.src;
    videoPlayRef.current = setTimeout(() => {
      const match = Array.from(
        document.querySelectorAll(".yarl__root video") as NodeListOf<HTMLVideoElement>
      ).find((v) =>
        Array.from(v.querySelectorAll("source")).some(
          (s) => s.getAttribute("src") === targetSrc
        ) || v.getAttribute("src") === targetSrc
      );
      match?.play().catch(() => {});
      videoPlayRef.current = null;
    }, 400);

    return () => {
      if (videoPlayRef.current) {
        clearTimeout(videoPlayRef.current);
        videoPlayRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbIndex]);

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

  // Navegación de la ventana mobile — saltan de a WINDOW_SIZE
  const handleWindowUp = useCallback(() => {
    setWindowStart((w) => Math.max(0, w - WINDOW_SIZE));
  }, []);

  const handleWindowDown = useCallback(() => {
    setWindowStart((w) =>
      Math.min(Math.max(0, displayFotos.length - WINDOW_SIZE), w + WINDOW_SIZE)
    );
  }, [displayFotos.length]);

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

  // Strip mobile activo solo con >1 foto (con 1 foto no tiene sentido el strip)
  const showMobileStrip = isMobile && showThumbnails && displayFotos.length > 1;

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

      {/* Lightbox
          Mobile: plugin Thumbnails desactivado → strip propio via render.controls.
          Desktop: plugin Thumbnails nativo con position según orientación. */}
      <Lightbox
        open={lbIndex >= 0}
        index={lbIndex}
        close={() => setLbIndex(-1)}
        slides={lightboxSlides}
        on={{ view: ({ index }) => setLbIndex(index) }}
        video={{ autoPlay: false, playsInline: true, preload: "auto" }}
        styles={{
          container: {
            backgroundColor: "rgba(17, 24, 39, 0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          },
        }}
        plugins={isMobile ? [Video] : showThumbnails ? [Thumbnails, Video] : [Video]}
        thumbnails={
          !isMobile && showThumbnails
            ? { position: thumbPos, width: 80, height: 60, border: 2, borderRadius: 6, padding: 4, gap: 8 }
            : undefined
        }
        render={
          showMobileStrip
            ? {
                controls: () => (
                  <MobileThumbStrip
                    photos={displayFotos}
                    activeIndex={lbIndex}
                    windowStart={windowStart}
                    onSelect={setLbIndex}
                    onScrollUp={handleWindowUp}
                    onScrollDown={handleWindowDown}
                  />
                ),
              }
            : undefined
        }
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
