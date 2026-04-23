"use client";

import { useState } from "react";
import ContactForm from "@/components/public/shared/ContactForm";
import MapSelector from "@/components/public/ui/MapSelector";

interface Sede {
  nombre: string;
  direccion: string;
  telefono: string;
  niveles: string;
}

interface Redes {
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

interface ContactoProps {
  sedes: Sede[];
  redes: Redes;
}

const sedesConfig = {
  basica: {
    key: "basica" as const,
    label: "Sede Básica",
    telefonoHref: "tel:642324545",
    urlMapa: "https://maps.app.goo.gl/6teQobdo5jpMrx7Q9",
  },
  media: {
    key: "media" as const,
    label: "Sede Media",
    telefonoHref: "tel:642320503",
    urlMapa: "https://maps.app.goo.gl/CrkzPMECdUvdi53w6",
  },
};

const IcoUbicacion = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IcoTelefono = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const IcoNiveles = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
  </svg>
);

const IcoNavegar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);

export default function Contacto({ sedes, redes }: ContactoProps) {
  const [sedeActiva, setSedeActiva] = useState<"basica" | "media">("basica");
  const [isChanging, setIsChanging] = useState(false);

  const handleSedeChange = (key: "basica" | "media") => {
    if (key === sedeActiva) return;
    setIsChanging(true);
    setSedeActiva(key);
    setTimeout(() => setIsChanging(false), 450);
  };

  const sedeData = sedesConfig[sedeActiva];
  const sedeInfo = sedeActiva === "basica" ? sedes[0] : sedes[1];

  return (
    <section id="contacto" className="pt-12 pb-8">
      <div className="container-gc">
        <div className="text-center mb-10 lg:mb-16">
          <h2 className="section-heading">Contacto</h2>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 max-w-6xl mx-auto">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-6">

            {/* Texto instruccional + Tabs de sede */}
            <div className="flex flex-col gap-2">
              <p className="font-body text-sm font-semibold text-gc-green-700">
                Selecciona una sede para continuar
              </p>
              <div className="flex gap-2 w-full">
                {(["basica", "media"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSedeChange(key)}
                    className={`flex-1 py-3 px-4 rounded-xl border-[1.5px] font-body transition-all duration-200 min-h-[44px] flex flex-col items-center gap-1 ${
                      sedeActiva === key
                        ? "border-gc-green bg-gc-green text-white"
                        : "border-gc-green/30 bg-white text-gc-green-800 font-medium hover:bg-gc-green-50"
                    }`}
                  >
                    <span className="font-semibold text-sm">{sedesConfig[key].label}</span>
                    {sedeActiva === key && (
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                        ✓ Seleccionada
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info de sede */}
            <div className="relative flex flex-col gap-3">
              {isChanging && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
                  <div className="w-5 h-5 border-2 border-gc-green/30 border-t-gc-green rounded-full animate-spin" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-gc-green-50 flex items-center justify-center text-gc-green shrink-0 mt-0.5">
                  <IcoUbicacion />
                </span>
                <span className="font-body text-sm text-gc-green-800 leading-relaxed pt-1">
                  {sedeInfo?.direccion}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gc-green-50 flex items-center justify-center text-gc-green shrink-0">
                  <IcoTelefono />
                </span>
                <a
                  href={sedeData.telefonoHref}
                  className="font-body text-sm text-gc-green-800 hover:text-gc-green transition-colors duration-200"
                >
                  {sedeInfo?.telefono}
                </a>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-gc-green-50 flex items-center justify-center text-gc-green shrink-0 mt-0.5">
                  <IcoNiveles />
                </span>
                <span className="font-body text-sm text-gc-green-800 leading-relaxed pt-1">
                  {sedeInfo?.niveles}
                </span>
              </div>
            </div>

            {/* Botón ¿Cómo llegar? */}
            {sedeActiva === "basica" ? (
              <MapSelector
                direccion="Los Carrera 387, La Unión"
                queryEncoded="Los+Carrera+387+La+Union+Chile"
              />
            ) : (
              <MapSelector
                direccion="Caupolicán 967, La Unión"
                queryEncoded="Caupolican+967+La+Union+Chile"
              />
            )}

            {/* Divisor + Redes sociales */}
            <div>
              <hr className="border-gc-green/10 mb-4" />
              <p className="text-xs font-body text-gc-gray-400 uppercase tracking-wide mb-3">
                Síguenos
              </p>
              <div className="flex gap-2">
                {redes.instagram && (
                  <a
                    href={redes.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2.5 -m-0.5 rounded-full"
                  >
                    <span className="w-[34px] h-[34px] rounded-full bg-gc-green-50 hover:bg-gc-green-100 transition-all duration-200 flex items-center justify-center text-gc-green">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </span>
                  </a>
                )}
                {redes.facebook && (
                  <a
                    href={redes.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2.5 -m-0.5 rounded-full"
                  >
                    <span className="w-[34px] h-[34px] rounded-full bg-gc-green-50 hover:bg-gc-green-100 transition-all duration-200 flex items-center justify-center text-gc-green">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </span>
                  </a>
                )}
                {redes.youtube && (
                  <a
                    href={redes.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="p-2.5 -m-0.5 rounded-full"
                  >
                    <span className="w-[34px] h-[34px] rounded-full bg-gc-green-50 hover:bg-gc-green-100 transition-all duration-200 flex items-center justify-center text-gc-green">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                      </svg>
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha — formulario */}
          <div className="relative bg-white p-6 lg:p-8 rounded-2xl border border-gray-100 shadow-sm">
            {isChanging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-2xl">
                <div className="w-5 h-5 border-2 border-gc-green/30 border-t-gc-green rounded-full animate-spin" />
              </div>
            )}
            <h3 className="font-display text-xl font-bold text-gc-green-800 mb-2">
              Envíanos un mensaje
            </h3>
            <p className="text-xs font-body text-gc-gray-400 mb-6">
              Escribiendo a:{" "}
              <span className="inline-block bg-gc-green-50 text-gc-green-800 border border-gc-green/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                {sedesConfig[sedeActiva].label}
              </span>
            </p>
            <ContactForm sede={sedeActiva} />
          </div>

        </div>
      </div>
    </section>
  );
}
