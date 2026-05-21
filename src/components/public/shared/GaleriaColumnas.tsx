"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ColumnsPhotoAlbum } from "react-photo-album";
import SSR from "react-photo-album/ssr";
import "react-photo-album/columns.css";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

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

// ─── Helpers de módulo ────────────────────────────────────────────────────────

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

// ─── Strip de thumbnails ──────────────────────────────────────────────────────
// WINDOW_SIZE: cantidad de miniaturas visibles a la vez en ambos modos.
// Mobile: strip vertical izquierda, flechas ▲/▼, navega de a WINDOW_SIZE.
// Desktop: strip horizontal inferior, flechas ◄/►, navega de a WINDOW_SIZE.
const WINDOW_SIZE = 5;
const MOBILE_STRIP_W = 68;   // px — ancho del strip mobile
const DESKTOP_STRIP_H = 84;  // px — alto del strip desktop (thumb 60px + breathing room)

// Props compartidas entre ambos strips
interface ThumbStripProps {
  photos: FotoColumnas[];
  activeIndex: number;
  windowStart: number;
  onSelect: (index: number) => void;
  onScrollPrev: () => void;
  onScrollNext: () => void;
}

// Miniaturas individuales — renderizado idéntico en ambos strips
function ThumbButton({
  photo,
  globalIdx,
  isActive,
  size,
  onSelect,
}: {
  photo: FotoColumnas;
  globalIdx: number;
  isActive: boolean;
  size: { w: number; h: number };
  onSelect: () => void;
}) {
  const isPureVideo = isVideo(photo.src) && !photo.poster;
  const imgSrc = isVideo(photo.src) && photo.poster ? photo.poster : photo.src;
  return (
    <button
      onClick={onSelect}
      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
        isActive
          ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)] scale-105"
          : "border-white/25 opacity-55 hover:opacity-85 active:scale-95"
      }`}
      style={{ width: size.w, height: size.h }}
      aria-label={`Imagen ${globalIdx + 1}`}
      aria-pressed={isActive}
    >
      {isPureVideo ? (
        <div className="absolute inset-0 bg-[#0f172a]" />
      ) : (
        <Image
          src={imgSrc}
          alt={photo.alt}
          fill
          sizes={`${size.w}px`}
          className="object-cover"
          style={{ pointerEvents: "none" }}
        />
      )}
      {isVideo(photo.src) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </button>
  );
}

// Strip MOBILE — vertical, izquierda del lightbox
function MobileThumbStrip({ photos, activeIndex, windowStart, onSelect, onScrollPrev, onScrollNext }: ThumbStripProps) {
  const total = photos.length;
  const canPrev = windowStart > 0;
  const canNext = windowStart + WINDOW_SIZE < total;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center gap-2 select-none z-10"
      style={{ width: MOBILE_STRIP_W }}
    >
      <button
        onClick={canPrev ? onScrollPrev : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          canPrev ? "opacity-90 active:scale-90" : "opacity-20 pointer-events-none"
        }`}
        aria-label="Anteriores"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {Array.from({ length: WINDOW_SIZE }, (_, i) => {
        const globalIdx = windowStart + i;
        if (globalIdx >= total) return null;
        return (
          <ThumbButton
            key={globalIdx}
            photo={photos[globalIdx]}
            globalIdx={globalIdx}
            isActive={globalIdx === activeIndex}
            size={{ w: 52, h: 52 }}
            onSelect={() => onSelect(globalIdx)}
          />
        );
      })}

      <button
        onClick={canNext ? onScrollNext : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          canNext ? "opacity-90 active:scale-90" : "opacity-20 pointer-events-none"
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

// Strip DESKTOP — horizontal, parte inferior del lightbox
function DesktopThumbStrip({ photos, activeIndex, windowStart, onSelect, onScrollPrev, onScrollNext }: ThumbStripProps) {
  const total = photos.length;
  const canPrev = windowStart > 0;
  const canNext = windowStart + WINDOW_SIZE < total;

  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex items-center justify-center gap-3 select-none bg-black/30 backdrop-blur-sm"
      style={{ height: DESKTOP_STRIP_H }}
    >
      <button
        onClick={canPrev ? onScrollPrev : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white transition-opacity duration-300 ${
          canPrev ? "opacity-90 hover:opacity-100 active:scale-90" : "opacity-20 pointer-events-none"
        }`}
        aria-label="Anteriores"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {Array.from({ length: WINDOW_SIZE }, (_, i) => {
        const globalIdx = windowStart + i;
        if (globalIdx >= total) return null;
        return (
          <ThumbButton
            key={globalIdx}
            photo={photos[globalIdx]}
            globalIdx={globalIdx}
            isActive={globalIdx === activeIndex}
            size={{ w: 80, h: 60 }}
            onSelect={() => onSelect(globalIdx)}
          />
        );
      })}

      <button
        onClick={canNext ? onScrollNext : undefined}
        className={`flex items-center justify-center w-8 h-8 rounded-full text-white transition-opacity duration-300 ${
          canNext ? "opacity-90 hover:opacity-100 active:scale-90" : "opacity-20 pointer-events-none"
        }`}
        aria-label="Siguientes"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosHintShow, setIosHintShow] = useState(false);
  const [iosHintVisible, setIosHintVisible] = useState(false);
  const [rotateHintShow, setRotateHintShow] = useState(false);
  const [rotateHintVisible, setRotateHintVisible] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const videoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detección de dispositivo — una sola vez al montar
  useEffect(() => {
    setMounted(true);
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    // maxTouchPoints > 0 es más confiable que innerWidth (no varía al rotar)
    setIsMobile(navigator.maxTouchPoints > 0);
  }, []);

  // Fullscreen automático al abrir el lightbox — solo en móvil no-iOS
  useEffect(() => {
    if (lbIndex >= 0) {
      if (isMobile && !isIOS) {
        const fsPromise = document.documentElement.requestFullscreen?.();
        if (fsPromise instanceof Promise) {
          fsPromise
            .then(() => (screen.orientation as any)?.lock?.("landscape").catch(() => {}))
            .catch(() => {
              setRotateHintShow(true);
              setTimeout(() => setRotateHintVisible(true), 50);
              setTimeout(() => setRotateHintVisible(false), 2800);
              setTimeout(() => setRotateHintShow(false), 3600);
            });
        } else {
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

  // Incluye todos los items: imágenes y videos (con o sin poster)
  const displayFotos = fotos;

  // Ventana deslizante: mantiene el thumb activo siempre dentro del rango visible
  useEffect(() => {
    if (lbIndex < 0) return;
    setWindowStart((prev) => {
      if (lbIndex < prev) return lbIndex;
      if (lbIndex >= prev + WINDOW_SIZE) return lbIndex - WINDOW_SIZE + 1;
      return prev;
    });
  }, [lbIndex]);

  // Autoplay de video con delay — espera la transición de slide antes de reproducir
  useEffect(() => {
    if (videoPlayRef.current) {
      clearTimeout(videoPlayRef.current);
      videoPlayRef.current = null;
    }
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

  // Solo cuentan items que disparan onLoad (imágenes reales o videos con poster)
  const imageCount = displayFotos.filter((f) => !isVideo(f.src) || !!f.poster).length;
  const pct = imageCount > 0 ? Math.round((loadedCount / imageCount) * 100) : 100;
  const allLoaded = pct >= 100;

  useEffect(() => {
    if (allLoaded && imageCount > 0 && mounted) {
      const t = setTimeout(() => setToastVisible(false), 1800);
      return () => clearTimeout(t);
    }
  }, [allLoaded, imageCount, mounted]);

  // Failsafe: marca todo como cargado a los 8s (imágenes lentas o rotas)
  useEffect(() => {
    if (!allLoaded && mounted && imageCount > 0) {
      const t = setTimeout(() => setLoadedCount(imageCount), 8000);
      return () => clearTimeout(t);
    }
  }, [allLoaded, imageCount, mounted]);

  const handleImageLoad = useCallback(() => {
    setLoadedCount((prev) => Math.min(prev + 1, imageCount));
  }, [imageCount]);

  // Navegación de la ventana — retrocede/avanza de a WINDOW_SIZE (mismo handler mobile y desktop)
  const handleWindowPrev = useCallback(() => {
    setWindowStart((w) => Math.max(0, w - WINDOW_SIZE));
  }, []);

  const handleWindowNext = useCallback(() => {
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

  // poster → video src (para videos que tienen poster)
  const videoByPoster = new Map<string, string>(
    displayFotos
      .filter((f) => isVideo(f.src) && f.poster)
      .map((f) => [f.poster!, f.src])
  );

  // video src → true (para videos sin poster — muestran placeholder oscuro en el grid)
  const noPosterVideoSrcs = new Set<string>(
    displayFotos.filter((f) => isVideo(f.src) && !f.poster).map((f) => f.src)
  );

  // El álbum muestra poster en vez del video crudo; sin poster, el src queda como video URL
  const albumPhotos = displayFotos.map((f) =>
    isVideo(f.src) && f.poster ? { ...f, src: f.poster } : f
  );

  // Slides del lightbox: imágenes normales + slides de video con sources tipados
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

  // Strips activos solo con >1 foto y showThumbnails habilitado
  const showMobileStrip  = isMobile  && showThumbnails && displayFotos.length > 1;
  const showDesktopStrip = !isMobile && showThumbnails && displayFotos.length > 1;

  const thumbStripProps: ThumbStripProps = {
    photos: displayFotos,
    activeIndex: lbIndex,
    windowStart,
    onSelect: setLbIndex,
    onScrollPrev: handleWindowPrev,
    onScrollNext: handleWindowNext,
  };

  return (
    <div className={className}>
      {/* justify-start: evita gaps desiguales en columnas de distinta altura */}
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
                const isNoPosterVideo = noPosterVideoSrcs.has(src ?? "");

                if (videoSrc) {
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
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/55 backdrop-blur-[2px] rounded-full flex items-center justify-center border-2 border-white/75 shadow-xl transition-transform duration-200 group-hover:scale-110">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isNoPosterVideo) {
                  return (
                    <div
                      className="relative group overflow-hidden rounded-lg cursor-pointer bg-[#0f172a]"
                      style={{ ...(style as React.CSSProperties), position: "relative" }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/55 backdrop-blur-[2px] rounded-full flex items-center justify-center border-2 border-white/75 shadow-xl transition-transform duration-200 group-hover:scale-110">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* ── Lightbox ──────────────────────────────────────────────────────────────
          · Thumbnails manejados por strips propios (mobile y desktop).
          · carousel.finite: true → el carrusel se detiene en el primer y último slide.
          · Mobile: strip izquierda (68px) → imagen y flecha prev se desplazan a la derecha.
          · Desktop: strip inferior (84px) → imagen se desplaza hacia arriba.
      */}
      <Lightbox
        open={lbIndex >= 0}
        index={lbIndex}
        close={() => setLbIndex(-1)}
        slides={lightboxSlides}
        on={{ view: ({ index }) => setLbIndex(index) }}
        video={{ autoPlay: false, playsInline: true, preload: "auto" }}
        carousel={{ finite: true }}
        plugins={[Video]}
        styles={{
          container: {
            backgroundColor: "rgba(17, 24, 39, 0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          },
          ...(showMobileStrip && {
            slide: { paddingLeft: `${MOBILE_STRIP_W}px` },
            navigationPrev: { left: `${MOBILE_STRIP_W}px` },
          }),
          ...(showDesktopStrip && {
            slide: { paddingBottom: `${DESKTOP_STRIP_H}px` },
          }),
        }}
        render={
          showMobileStrip
            ? { controls: () => <MobileThumbStrip {...thumbStripProps} /> }
            : showDesktopStrip
            ? { controls: () => <DesktopThumbStrip {...thumbStripProps} /> }
            : undefined
        }
      />

      {/* Toast de carga — aparece mientras cargan las imágenes, desaparece al terminar */}
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
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Galería lista</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0 animate-spin text-gc-green" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* Aviso iOS: pantalla completa no disponible en Safari */}
      {iosHintShow && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 bg-black/75 text-white/90 text-xs rounded-full backdrop-blur-sm whitespace-nowrap pointer-events-none transition-opacity duration-700 ${
            iosHintVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          Pantalla completa no disponible en iOS — limitación del navegador
        </div>
      )}

      {/* Aviso de rotación: browser no soporta fullscreen (Opera, etc.) */}
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
