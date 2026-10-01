"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { getImageProps } from "next/image";
import GaleriaColumnas, { sizesCeldaMovil, type FotoColumnas } from "./GaleriaColumnas";

export interface EdicionGaleria {
  anio: number;
  fotos: FotoColumnas[];
}

interface GaleriaEdicionesProps {
  nombreEvento: string;
  ediciones: EdicionGaleria[];
  /** Año que se muestra al entrar a la página — la edición activa del evento. */
  edicionActiva: number;
  /**
   * Contenido a la izquierda de la fila inferior (el "Volver a Historias" de la
   * subpágina). Va acá adentro para compartir fila con el selector de abajo.
   */
  pie?: ReactNode;
}

/**
 * Galería del evento con selector de año. La edición activa se ve completa al
 * cargar; el resto ("Ediciones anteriores") son pills clickeables que
 * intercambian la galería sin salir de la página — todo resuelto en el build,
 * sin fetch ni ruta nueva (el sitio sigue 100% estático).
 */
const VIDEO_RE = /\.(mp4|webm|mov)$/i;
/** Descargas simultáneas de la precarga: poco, para no competirle a lo visible. */
const PRECARGA_PARALELO = 3;

/**
 * Descarga en segundo plano las imágenes de una edición con las MISMAS URLs que
 * pedirá la galería al mostrarla (mismo srcset/sizes de next/image: celda 4:5
 * en móvil, ~1/3 de ancho en el masonry de desktop). Así el cambio de edición
 * sale del caché del navegador. De los videos solo baja el poster: el clip se
 * carga recién al abrirlo.
 */
async function precargarEdicion(fotos: FotoColumnas[], cancelada: () => boolean) {
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  const cola = fotos
    .map((f) => (VIDEO_RE.test(f.src) ? (f.poster ? { ...f, src: f.poster } : null) : f))
    .filter((f): f is FotoColumnas => f !== null);

  const bajar = (f: FotoColumnas) =>
    new Promise<void>((resolve) => {
      const { props } = getImageProps({
        src: f.src,
        alt: "",
        width: f.width,
        height: f.height,
        sizes: desktop ? "33vw" : sizesCeldaMovil(f),
      });
      const img = new window.Image();
      img.onload = img.onerror = () => resolve();
      if (props.sizes) img.sizes = props.sizes;
      if (props.srcSet) img.srcset = props.srcSet;
      img.src = props.src;
    });

  const trabajador = async () => {
    while (cola.length > 0 && !cancelada()) await bajar(cola.shift()!);
  };
  await Promise.all(Array.from({ length: PRECARGA_PARALELO }, trabajador));
}

/** Etiqueta genérica de una edición — nunca el año crudo, para no tener que
 *  tocar texto cada vez que se crea/compacta una carpeta nueva. */
function etiquetaEdicion(anio: number, edicionActiva: number): string {
  return anio === edicionActiva ? "Última versión" : "Años anteriores";
}

export default function GaleriaEdiciones({
  nombreEvento,
  ediciones,
  edicionActiva,
  pie,
}: GaleriaEdicionesProps) {
  const [anioSeleccionado, setAnioSeleccionado] = useState(edicionActiva);
  const seleccionada = ediciones.find((e) => e.anio === anioSeleccionado) ?? ediciones[0];

  // Prioridad de carga: primero la edición activa (la que se ve al entrar);
  // recién cuando termina, se precargan las anteriores, de la más nueva a la
  // más vieja y una edición a la vez. activaLista pasa a true una sola vez, así
  // que el efecto corre una vez por visita.
  const [activaLista, setActivaLista] = useState(false);
  const alTerminarGaleria = useCallback(() => setActivaLista(true), []);

  useEffect(() => {
    if (!activaLista) return;
    // Con "ahorro de datos" activado no se baja nada que no se haya pedido.
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;

    let cancelada = false;
    (async () => {
      const pendientes = ediciones.filter((e) => e.anio !== edicionActiva);
      for (const e of pendientes) {
        if (cancelada) return;
        await precargarEdicion(e.fotos, () => cancelada);
      }
    })();
    return () => { cancelada = true; };
  }, [activaLista, ediciones, edicionActiva]);

  const inicioRef = useRef<HTMLDivElement>(null);

  // Selector de abajo: al cambiar de edición se sube al inicio de la galería
  // nueva — si no, uno queda mirando el final de una galería de otro largo.
  const elegirDesdeAbajo = (anio: number) => {
    setAnioSeleccionado(anio);
    inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!seleccionada || seleccionada.fotos.length === 0) {
    return pie ? <div className="mt-10">{pie}</div> : null;
  }

  const selector = (alElegir: (anio: number) => void) => (
    <div className="flex flex-wrap gap-2">
      {ediciones.map((e) => (
        <button
          key={e.anio}
          type="button"
          title={String(e.anio)}
          onClick={() => alElegir(e.anio)}
          aria-pressed={e.anio === anioSeleccionado}
          className={`px-4 py-2 text-sm font-body rounded-full border transition-colors duration-200 ${
            e.anio === anioSeleccionado
              ? "bg-gc-gold border-gc-gold text-gc-green-900 font-semibold"
              : "bg-white border-gc-green-100 text-gc-green-800/60 hover:border-gc-gold/50 hover:text-gc-green-800"
          }`}
        >
          {etiquetaEdicion(e.anio, edicionActiva)}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div ref={inicioRef} className="scroll-mt-24 border-l-4 border-gc-gold pl-4 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs font-body font-semibold text-gc-green-600 uppercase tracking-widest mb-1">
            {nombreEvento}
          </p>
          <h2
            className="text-2xl sm:text-3xl font-display font-bold text-gc-green-800"
            title={String(anioSeleccionado)}
          >
            Galería — {etiquetaEdicion(anioSeleccionado, edicionActiva)}
          </h2>
        </div>

        {ediciones.length > 1 && (
          <div>
            <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-2">
              Ediciones
            </p>
            {selector(setAnioSeleccionado)}
          </div>
        )}
      </div>

      {/* key por año: GaleriaColumnas guarda las fotos en estado al montar
          (dimensiones de video sondeadas, conteo de carga, lightbox). Sin
          remontar, cambiar de edición solo cambiaba el título y seguía
          mostrando la galería de la última versión. */}
      <GaleriaColumnas
        key={seleccionada.anio}
        fotos={seleccionada.fotos}
        onLista={seleccionada.anio === edicionActiva ? alTerminarGaleria : undefined}
      />

      {/* Fila inferior: volver + el mismo selector, para cambiar de edición
          sin tener que subir toda la galería. */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {pie}
        {ediciones.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider">
              Ediciones
            </span>
            {selector(elegirDesdeAbajo)}
          </div>
        )}
      </div>
    </div>
  );
}
