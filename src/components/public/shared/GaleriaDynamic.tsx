"use client";

import { useState, useEffect } from "react";
import GaleriaColumnas from "./GaleriaColumnas";
import type { FotoColumnas } from "./GaleriaColumnas";

interface Props {
  fotos: FotoColumnas[];
  spacing?: number;
  columns?: (containerWidth: number) => number;
  showThumbnails?: boolean;
  className?: string;
}

function GaleriaSkeleton({ fotos, className }: { fotos: FotoColumnas[]; className?: string }) {
  return (
    <div className={`${className ?? ""} columns-2 md:columns-3 gap-[10px]`}>
      {fotos.map((foto) => (
        <div key={foto.src} className="break-inside-avoid mb-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.src}
            alt={foto.alt}
            width={foto.width}
            height={foto.height}
            className="rounded-lg w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default function GaleriaDynamic({ fotos, className, ...rest }: Props) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <GaleriaSkeleton fotos={fotos} className={className} />;
  }

  return <GaleriaColumnas fotos={fotos} className={className} {...rest} />;
}
