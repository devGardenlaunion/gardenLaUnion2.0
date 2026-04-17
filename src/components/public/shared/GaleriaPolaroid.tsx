"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

export interface FotoPolaroid {
  src: string;
  caption: string;
}

interface GaleriaPolaroidProps {
  fotos: FotoPolaroid[];
  /**
   * "fullscreen" (default): click abre lightbox oscuro a pantalla completa.
   * "inline": la foto seleccionada sube y se centra dentro del contenedor,
   *           sin overlay. Ideal para columnas dentro de secciones.
   */
  lightboxMode?: "fullscreen" | "inline";
  /**
   * Nivel de desorden de las fotos. 0 = grilla ordenada, 1 = máximo caos.
   * Controla posición, rotación (±18°) y desplazamiento.
   * Default: 0.8. En admin: slider 0–100 normalizado a 0–1.
   */
  desorden?: number;
}

/** Pseudo-random determinista por índice — evita diferencias de hydration */
function sr(seed: number): number {
  const x = Math.sin(seed + 2) * 10000;
  return x - Math.floor(x);
}

/** Marco polaroid reutilizable */
function Polaroid({
  foto,
  shadow = "soft",
  size = "sm",
}: {
  foto: FotoPolaroid;
  shadow?: "soft" | "lifted";
  size?: "sm" | "lg";
}) {
  // Dimensiones del área de imagen: sm = miniatura en la mesa, lg = overlay ampliado
  const imgClass = size === "lg"
    ? "w-72 sm:w-96"   // ancho fijo; alto se adapta a la imagen
    : "w-28 sm:w-44";  // miniatura

  return (
    <div
      className="bg-white p-2.5 pb-4"
      style={{
        boxShadow:
          shadow === "lifted"
            ? "0 24px 64px rgba(0,0,0,0.40)"
            : "0 4px 16px rgba(0,0,0,0.20)",
      }}
    >
      {/* next/image con layout natural: preserva proporción sin recortar */}
      <div className={`${imgClass} bg-gc-gray-100`}>
        <Image
          src={foto.src}
          alt={foto.caption}
          width={0}
          height={0}
          sizes={size === "lg" ? "(max-width: 640px) 288px, 384px" : "176px"}
          className="w-full h-auto block"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}

export default function GaleriaPolaroid({
  fotos,
  lightboxMode = "fullscreen",
  desorden = 0.8,
}: GaleriaPolaroidProps) {
  const d = Math.min(1, Math.max(0, desorden));

  const [activeIndex, setActiveIndex]   = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted]           = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const containerRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (lightboxMode !== "fullscreen") return;
    document.body.style.overflow = activeIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeIndex, lightboxMode]);

  // ── Posiciones absolutas de cada foto ──────────────────────────────────
  // Interpola entre grilla ordenada (d=0) y dispersión caótica (d=1).
  // Luego aplica paso de separación mínima para que ninguna foto tape
  // más del ~75% de otra (siempre se ve al menos un cuarto de cada foto).
  const positions = useMemo(() => {
    const COLS      = isMobile ? 2 : 3;
    const totalRows = Math.ceil(fotos.length / COLS);

    const result = fotos.map((_, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      // Posición grilla: distribución limpia en el área útil del contenedor
      const gridX = COLS > 1 ? 20 + (col / (COLS - 1)) * 60 : 50; // 20 | 50 | 80 %
      const gridY = totalRows > 1
        ? 15 + (row / (totalRows - 1)) * 70                          // 15 … 85 %
        : 50;

      // Posición aleatoria: dispersa en toda el área, con margen de borde
      const randX = sr(i * 5)     * 68 + 16; // 16 … 84 %
      const randY = sr(i * 5 + 1) * 68 + 16;

      // Interpolación lineal según desorden
      const x = gridX + (randX - gridX) * d;
      const y = gridY + (randY - gridY) * d;

      // Rotación ±18° × desorden
      const rotation = (sr(i * 3) * 36 - 18) * d;

      // Z-index base aleatorio (1–10) para que unas tapen a otras naturalmente
      const zBase = Math.floor(sr(i * 7 + 3) * 10) + 1;

      return { x, y, rotation, zBase };
    });

    // Paso de separación: empuja fotos que se solapan demasiado.
    // MIN_DIST en % del contenedor — foto sm ≈ 36% de ancho,
    // con 27% de separación mínima queda siempre ~25% visible.
    const MIN_DIST = isMobile ? 32 : 27;
    for (let iter = 0; iter < 5; iter++) {
      for (let a = 0; a < result.length; a++) {
        for (let b = a + 1; b < result.length; b++) {
          const dx   = result[b].x - result[a].x;
          const dy   = result[b].y - result[a].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MIN_DIST && dist > 0.01) {
            const push = (MIN_DIST - dist) / 2;
            const nx   = dx / dist;
            const ny   = dy / dist;
            result[a].x = Math.min(84, Math.max(16, result[a].x - nx * push));
            result[a].y = Math.min(84, Math.max(16, result[a].y - ny * push));
            result[b].x = Math.min(84, Math.max(16, result[b].x + nx * push));
            result[b].y = Math.min(84, Math.max(16, result[b].y + ny * push));
          }
        }
      }
    }

    return result;
  }, [fotos, d, isMobile]);

  // Altura del contenedor: suficiente para el número de "filas" equivalentes
  const cols = isMobile ? 2 : 3;
  const containerHeight = isMobile
    ? Math.max(360, Math.ceil(fotos.length / cols) * 210)
    : Math.max(420, Math.ceil(fotos.length / cols) * 250);

  // ── Hover por proximidad al centro de cada foto ────────────────────────
  // Detecta la foto más cercana al cursor aunque esté tapada por otra,
  // resolviendo el problema de hover inaccesible en fotos con z-index bajo.
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mounted) return;
    // No activar hover de fotos cuando el cursor está sobre un botón de navegación
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width)  * 100;
    const my = ((e.clientY - rect.top)  / rect.height) * 100;

    let minDist = Infinity;
    let closest = -1;
    positions.forEach(({ x, y }, i) => {
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < minDist) { minDist = dist; closest = i; }
    });

    setHoveredIndex(minDist < 22 ? closest : null);
  }, [positions, mounted]);

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), []);

  // ── Callbacks ──────────────────────────────────────────────────────────
  const close = useCallback(() => setActiveIndex(null), []);

  const prev = useCallback(
    () => setActiveIndex((i) => (i !== null ? (i - 1 + fotos.length) % fotos.length : null)),
    [fotos.length]
  );

  const next = useCallback(
    () => setActiveIndex((i) => (i !== null ? (i + 1) % fotos.length : null)),
    [fotos.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      close();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, close, prev, next]);

  const getTransform = (i: number, isHovered: boolean) => {
    if (!mounted) return "translate(-50%, -50%)";
    const { rotation } = positions[i];
    if (isHovered) return "translate(-50%, -50%) rotate(0deg) scale(1.08)";
    return `translate(-50%, -50%) rotate(${rotation}deg)`;
  };

  const hasActive = activeIndex !== null;

  return (
    <>
      {/* ── Mesa de fotos ── */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `min(${containerHeight}px, 85vh)`, overflow: "visible" }}
        onClick={() => lightboxMode === "inline" && close()}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {fotos.map((foto, i) => {
          const { x, y, zBase } = positions[i];
          const isActive  = lightboxMode === "inline" && activeIndex === i;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(activeIndex === i ? null : i);
              }}
              onTouchStart={() => setHoveredIndex(i)}
              onTouchEnd={() => setTimeout(() => setHoveredIndex(null), 400)}
              className="absolute cursor-pointer select-none"
              style={{
                left:       `${parseFloat(x.toFixed(4))}%`,
                top:        `${parseFloat(y.toFixed(4))}%`,
                transform:  getTransform(i, isHovered),
                // Solo post-mount: evita mismatch por expansión del shorthand en SSR.
                // z-9999 es el máximo DENTRO del stacking context del padre (z-20 en QuienesSomos),
                // por lo que nunca puede superar el header (z-50 global).
                transition: mounted ? "transform 300ms ease-out, opacity 250ms ease-out, box-shadow 300ms ease-out" : undefined,
                zIndex:     isHovered ? 9999 : zBase,
                visibility: isActive ? "hidden" : "visible",
                opacity:    lightboxMode === "inline" && hasActive && !isActive && !isHovered ? 0.4 : 1,
              }}
            >
              <Polaroid foto={foto} shadow={isHovered ? "lifted" : "soft"} />
            </div>
          );
        })}

        {/* ── Overlay inline centrado ── */}
        {/* z-[10000]: debe superar el polaroid hovered (z-9999) dentro del mismo stacking context */}
        {lightboxMode === "inline" && hasActive && (
          <div className="absolute inset-0 flex items-center justify-center z-[10000] pointer-events-none">
            <div
              className="relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Polaroid foto={fotos[activeIndex!]} shadow="lifted" size="lg" />

              <button
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="absolute -top-4 -right-4 bg-white rounded-full shadow-lg p-2 text-gc-gray-500 hover:text-gc-gray-900 transition-colors z-10"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Flechas inline */}
        {lightboxMode === "inline" && hasActive && fotos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-[10001] bg-white/85 hover:bg-white shadow-md rounded-full p-3 text-gc-gray-700 hover:text-gc-gray-900 transition-all"
              aria-label="Foto anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-[10001] bg-white/85 hover:bg-white shadow-md rounded-full p-3 text-gc-gray-700 hover:text-gc-gray-900 transition-all"
              aria-label="Foto siguiente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Lightbox fullscreen ── */}
      {lightboxMode === "fullscreen" && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
            aria-label="Cerrar"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {fotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 sm:left-6 text-white/70 hover:text-white transition-colors p-2"
              aria-label="Foto anterior"
            >
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            className="bg-white p-3 sm:p-4 pb-4 shadow-2xl w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fotos[activeIndex].src}
              alt={fotos[activeIndex].caption}
              width={0}
              height={0}
              sizes="(max-width: 768px) 95vw, 768px"
              className="w-full h-auto block"
              style={{ maxHeight: "80vh", objectFit: "contain" }}
              priority
            />
          </div>

          {fotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 sm:right-6 text-white/70 hover:text-white transition-colors p-2"
              aria-label="Foto siguiente"
            >
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-body tabular-nums">
            {activeIndex + 1} / {fotos.length}
          </div>
        </div>
      )}
    </>
  );
}
