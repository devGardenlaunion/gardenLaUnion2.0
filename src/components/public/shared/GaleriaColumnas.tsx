"use client";

import { useState } from "react";
import { ColumnsPhotoAlbum } from "react-photo-album";
import SSR from "react-photo-album/ssr";
import "react-photo-album/columns.css";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export interface FotoColumnas {
  src: string;
  width: number;
  height: number;
  alt: string;
}

interface GaleriaColumnasProps {
  fotos: FotoColumnas[];
  /**
   * Espaciado en px entre fotos. Default: 10.
   */
  spacing?: number;
  /**
   * Función que devuelve el número de columnas según el ancho del contenedor.
   * Default: 2 (móvil) → 3 (tablet) → 4 (desktop).
   */
  columns?: (containerWidth: number) => number;
  /**
   * Muestra barra de thumbnails en el lightbox. Default: true.
   */
  showThumbnails?: boolean;
  className?: string;
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
  const [index, setIndex] = useState(-1);

  if (fotos.length === 0) {
    return (
      <p className="text-center text-gc-gray-500 font-body py-8">
        No hay fotos disponibles aún.
      </p>
    );
  }

  return (
    <div className={className}>
      <SSR breakpoints={[375, 640, 1200]}>
        <ColumnsPhotoAlbum
          photos={fotos}
          spacing={spacing}
          columns={columns}
          onClick={({ index: i }) => setIndex(i)}
          render={{
            image: (imageProps) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...imageProps}
                alt={imageProps.alt ?? "Galería Garden College"}
                className="rounded-lg cursor-pointer object-cover hover:brightness-90 transition-[filter,transform] duration-300 hover:scale-[1.01]"
              />
            ),
          }}
        />
      </SSR>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={fotos}
        on={{ view: ({ index: i }) => setIndex(i) }}
        styles={{
          container: {
            backgroundColor: "rgba(17, 24, 39, 0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          },
        }}
        plugins={showThumbnails ? [Thumbnails] : []}
        thumbnails={{
          position: "bottom",
          width: 80,
          height: 60,
          border: 2,
          borderRadius: 6,
          padding: 4,
          gap: 8,
        }}
      />
    </div>
  );
}
