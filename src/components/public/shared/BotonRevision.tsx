"use client";

import { useEffect, useState } from "react";
import { TEMA_EVENT, temaActivo, toggleTema } from "@/lib/tema";

/**
 * Botón discreto en el footer que enciende/apaga el MODO REVISIÓN (vista previa
 * del tema del uniforme nuevo). Se sincroniza con el aviso flotante vía el evento
 * TEMA_EVENT, así ambos reflejan el mismo estado sin recargar.
 */
export default function BotonRevision() {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const sync = () => setActivo(temaActivo());
    sync();
    window.addEventListener(TEMA_EVENT, sync);
    return () => window.removeEventListener(TEMA_EVENT, sync);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-pressed={activo}
      className="text-xs font-body text-white/30 hover:text-gc-gold/80 transition-colors
                 underline-offset-2 hover:underline"
    >
      {activo ? "Salir del modo revisión" : "Vista previa: tema uniforme nuevo"}
    </button>
  );
}
