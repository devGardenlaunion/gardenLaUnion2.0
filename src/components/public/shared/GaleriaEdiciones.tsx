"use client";

import { useState } from "react";
import GaleriaColumnas, { type FotoColumnas } from "./GaleriaColumnas";

export interface EdicionGaleria {
  anio: number;
  fotos: FotoColumnas[];
}

interface GaleriaEdicionesProps {
  nombreEvento: string;
  ediciones: EdicionGaleria[];
  /** Año que se muestra al entrar a la página — la edición activa del evento. */
  edicionActiva: number;
}

/**
 * Galería del evento con selector de año. La edición activa se ve completa al
 * cargar; el resto ("Ediciones anteriores") son pills clickeables que
 * intercambian la galería sin salir de la página — todo resuelto en el build,
 * sin fetch ni ruta nueva (el sitio sigue 100% estático).
 */
export default function GaleriaEdiciones({
  nombreEvento,
  ediciones,
  edicionActiva,
}: GaleriaEdicionesProps) {
  const [anioSeleccionado, setAnioSeleccionado] = useState(edicionActiva);
  const seleccionada = ediciones.find((e) => e.anio === anioSeleccionado) ?? ediciones[0];

  if (!seleccionada || seleccionada.fotos.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="border-l-4 border-gc-gold pl-4 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs font-body font-semibold text-gc-green-600 uppercase tracking-widest mb-1">
            {nombreEvento}
          </p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gc-green-800">
            Galería {anioSeleccionado}
          </h2>
        </div>

        {ediciones.length > 1 && (
          <div>
            <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-2">
              Ediciones anteriores
            </p>
            <div className="flex flex-wrap gap-2">
              {ediciones.map((e) => (
                <button
                  key={e.anio}
                  type="button"
                  onClick={() => setAnioSeleccionado(e.anio)}
                  aria-pressed={e.anio === anioSeleccionado}
                  className={`px-4 py-2 text-sm font-body rounded-full border transition-colors duration-200 ${
                    e.anio === anioSeleccionado
                      ? "bg-gc-gold border-gc-gold text-gc-green-900 font-semibold"
                      : "bg-white border-gc-green-100 text-gc-green-800/60 hover:border-gc-gold/50 hover:text-gc-green-800"
                  }`}
                >
                  {e.anio}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <GaleriaColumnas fotos={seleccionada.fotos} />
    </div>
  );
}
