"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Overlay de carga que se muestra al navegar desde una página secundaria
 * a un anchor de la main page (ej: /eventos/slug → /#galeria).
 *
 * Problema que resuelve: GaleriaColumnas causa layout shifts al cargar
 * imágenes en el lado cliente. Si el browser ya hizo el hash-scroll nativo
 * antes del layout shift, la posición queda desfasada.
 *
 * Flujo:
 *   1. Se detecta un hash en la URL al montar (ej: #galeria, #contacto)
 *   2. Se muestra el overlay cubriendo la página
 *   3. GaleriaColumnas despacha CustomEvent("galeria:lista") al terminar
 *   4. Se corrige el scroll con behavior:"instant" (oculto bajo el overlay)
 *   5. Fade-out del overlay → el usuario ve la sección correcta
 *
 * Para usar el slot de media, pasar mediaUrl + mediaType desde page.tsx.
 * El archivo puede vivir en public/media/LoadingOverlay/ (gif o mp4 liviano).
 * Sin props de media → muestra spinner de fallback.
 */

interface HashScrollClientProps {
  // Ruta pública al archivo de media, ej: "/media/LoadingOverlay/loop.mp4"
  mediaUrl?: string;
  mediaType?: "gif" | "mp4";
}

// Hashes que no necesitan corrección (están sobre la galería o son el top)
const SKIP_HASHES = new Set(["", "inicio", "quienes-somos", "convivencia", "eventos"]);

export default function HashScrollClient({ mediaUrl, mediaType }: HashScrollClientProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const targetRef = useRef("");

  useEffect(() => {
    const hash = window.location.hash.slice(1); // quitar el "#"
    if (SKIP_HASHES.has(hash)) return;

    targetRef.current = hash;
    setVisible(true);

    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;

      // Scroll corregido mientras el overlay aún cubre la pantalla
      const el = document.getElementById(targetRef.current);
      el?.scrollIntoView({ behavior: "instant" });

      // Esperar un frame para que el scroll aplique, luego fade-out
      setTimeout(() => {
        setFading(true);
        setTimeout(() => setVisible(false), 550);
      }, 80);
    }

    const handler = () => dismiss();
    window.addEventListener("galeria:lista", handler);

    // Failsafe: si la galería tarda más de 8s (mismo timeout que su propio failsafe)
    const failsafe = setTimeout(dismiss, 8000);

    return () => {
      window.removeEventListener("galeria:lista", handler);
      clearTimeout(failsafe);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gc-navy/75 backdrop-blur-md
        transition-opacity duration-500
        ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* ── Slot de media ─────────────────────────────────────────────────────
          Para activar: pasar mediaUrl="/media/LoadingOverlay/loop.mp4" (o .gif)
          y mediaType="mp4" (o "gif") desde page.tsx.
          El archivo debe ser liviano: < 2MB, bucle corto (2-4s), sin audio.
          Tamaño recomendado: 480×270 px o similar (ratio 16:9).
      ──────────────────────────────────────────────────────────────────────── */}
      {mediaUrl && mediaType === "mp4" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="max-h-[60vh] max-w-[80vw] rounded-xl shadow-2xl object-contain"
        >
          <source src={mediaUrl} type="video/mp4" />
        </video>
      ) : mediaUrl && mediaType === "gif" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt=""
          className="max-h-[60vh] max-w-[80vw] rounded-xl shadow-2xl object-contain"
        />
      ) : (
        /* Fallback spinner — se usa mientras no hay archivo de media */
        <svg
          className="w-14 h-14 text-gc-gold animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      <p className="mt-5 text-white/55 font-body text-sm tracking-wide select-none">
        Cargando...
      </p>
    </div>
  );
}
