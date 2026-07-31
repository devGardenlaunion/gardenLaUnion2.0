"use client";

import { useEffect, useState } from "react";
import { TEMA_EVENT, temaActivo, aplicarTema } from "@/lib/tema";

/**
 * Aviso flotante que aparece SOLO cuando el MODO REVISIÓN está activo. Se monta
 * global en el layout (para que se vea en toda página mientras dura la vista
 * previa) y ofrece salir. El tema en sí ya lo aplica el script inline del <head>
 * a partir de la cookie; acá solo reflejamos el estado y damos la salida.
 */
export default function ModoRevision() {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const sync = () => setActivo(temaActivo());
    sync(); // estado real tras montar (el server siempre renderiza oculto)
    window.addEventListener(TEMA_EVENT, sync);
    return () => window.removeEventListener(TEMA_EVENT, sync);
  }, []);

  if (!activo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3
                 rounded-full border border-gc-gold/40 bg-gc-navy/95 text-white
                 shadow-lg backdrop-blur px-4 py-2 max-w-[calc(100vw-2rem)]"
    >
      <span className="flex h-2 w-2 shrink-0 rounded-full bg-gc-gold animate-pulse" aria-hidden="true" />
      <span className="text-xs sm:text-sm font-body">
        <strong className="font-semibold">MODO REVISIÓN</strong>
        <span className="hidden sm:inline"> · vista previa del tema del uniforme nuevo</span>
      </span>
      <button
        type="button"
        onClick={() => aplicarTema(false)}
        className="shrink-0 rounded-full bg-white/15 hover:bg-white/25 transition-colors
                   px-3 py-1 text-xs font-semibold"
      >
        Salir
      </button>
    </div>
  );
}
