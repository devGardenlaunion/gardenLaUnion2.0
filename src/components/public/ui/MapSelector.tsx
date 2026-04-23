"use client";

import { useState, useEffect } from "react";

interface MapSelectorProps {
  direccion: string;
  queryEncoded: string;
  className?: string;
}

export default function MapSelector({ direccion, queryEncoded, className }: MapSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sheetOpen]);

  const wazeUrl = `https://waze.com/ul?q=${queryEncoded}&navigate=yes`;
  const mapsUrl = `https://maps.google.com/?daddr=${queryEncoded}`;

  const handleMainClick = () => {
    if (isMobile) {
      setSheetOpen(true);
    } else {
      window.open(mapsUrl, "_blank");
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleMainClick}
        className="w-full py-3 rounded-xl border border-gc-green bg-white text-gc-green-800 font-body font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gc-green-50 transition-colors duration-200 min-h-[44px]"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
        </svg>
        ¿Cómo llegar?
      </button>

      {/* Overlay — siempre en DOM, invisible y no interactivo cuando cerrado */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
        style={{
          opacity: sheetOpen ? 1 : 0,
          pointerEvents: sheetOpen ? "auto" : "none",
        }}
        onClick={() => setSheetOpen(false)}
        aria-hidden="true"
      />

      {/* Sheet — siempre en DOM, traducido fuera de pantalla cuando cerrado */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 z-50"
        style={{
          transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 300ms ease-out",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar app de navegación"
      >
        <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <p className="font-display text-gc-green-800 text-base font-semibold text-center mb-1">
          ¿Con qué app querés navegar?
        </p>
        <p className="text-sm text-gc-gray-400 text-center mb-4">{direccion}</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { window.open(wazeUrl, "_blank"); setSheetOpen(false); }}
            className="flex items-center gap-3 p-3 rounded-xl border border-gc-green/20 bg-gc-green-50 hover:bg-gc-green-100 transition-colors w-full min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#33CCFF] flex items-center justify-center shrink-0">
              <svg fill="white" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 1.9.5 3.7 1.4 5.3L1.5 21l3.8-1.3C6.8 20.5 9.3 21 12 21c5.8 0 10.5-4.7 10.5-10.5S17.8 1.5 12 1.5zm.5 15.5h-1v-1h1v1zm0-3h-1c0-3.3 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-1c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2.7-3 2.7-3 5z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gc-green-800">Waze</p>
              <p className="text-xs text-gc-gray-400">Navegación con tráfico en tiempo real</p>
            </div>
          </button>

          <button
            onClick={() => { window.open(mapsUrl, "_blank"); setSheetOpen(false); }}
            className="flex items-center gap-3 p-3 rounded-xl border border-gc-green/20 bg-gc-green-50 hover:bg-gc-green-100 transition-colors w-full min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EA4335] flex items-center justify-center shrink-0">
              <svg fill="white" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gc-green-800">Google Maps</p>
              <p className="text-xs text-gc-gray-400">Abrir en Google Maps</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => setSheetOpen(false)}
          className="w-full py-2 text-sm text-gc-gray-400 mt-1"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
