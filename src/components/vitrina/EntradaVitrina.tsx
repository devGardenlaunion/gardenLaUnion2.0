"use client";

import { useEffect, useRef, useState } from "react";
import Vitrina, { type Guiones } from "./Vitrina";

/**
 * La puerta de la vitrina: qué versión y qué pantalla, y «Abrir» (que además pide pantalla completa: el navegador solo
 * la da tras un toque). La pantalla parte adivinada por la forma de la ventana (un tótem es más alto que ancho).
 * Nada se guarda: recargar vuelve aquí.
 */
const VERSIONES = [
  { clave: "corta", nombre: "Corta", que: "~2 min, lo esencial" },
  { clave: "larga", nombre: "Larga", que: "~20 min, con calma" },
];
const PANTALLAS = [
  { clave: "horizontal", nombre: "Horizontal", que: "TV o proyector" },
  { clave: "vertical", nombre: "Vertical", que: "Tótem de pie, 9:16" },
];

export default function EntradaVitrina({ guiones, qr }: { guiones: Guiones; qr: string }) {
  const [version, setVersion] = useState("corta");
  const [pantalla, setPantalla] = useState("horizontal");
  const [abierta, setAbierta] = useState(false);
  // Lo bajado (fotos y videos como `blob:`) se comparte entre versiones y pantallas: cambiar no vuelve a bajar.
  const blobs = useRef(new Map<string, string>());

  useEffect(() => {
    if (window.innerHeight > window.innerWidth) setPantalla("vertical");
  }, []);

  function abrir(e: React.FormEvent) {
    e.preventDefault();
    setAbierta(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function salir() {
    for (const u of blobs.current.values()) URL.revokeObjectURL(u);
    blobs.current.clear();
    setAbierta(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  if (abierta)
    return (
      <Vitrina
        guiones={guiones}
        qr={qr}
        version={version}
        pantalla={pantalla}
        blobs={blobs.current}
        alCambiar={(v, p) => {
          setVersion(v);
          setPantalla(p);
        }}
        alSalir={salir}
      />
    );

  return (
    <main className="vitrina-entrada">
      <form onSubmit={abrir}>
        <img src="/media/Logo/leon-circulo.webp" alt="" aria-hidden className="vitrina-entrada-leon" />
        <h1>Vitrina del colegio</h1>
        <Elegir titulo="Versión" opciones={VERSIONES} valor={version} alElegir={setVersion} />
        <Elegir titulo="Pantalla" opciones={PANTALLAS} valor={pantalla} alElegir={setPantalla} />
        <button type="submit">Abrir la vitrina</button>
      </form>
    </main>
  );
}

function Elegir({
  titulo,
  opciones,
  valor,
  alElegir,
}: {
  titulo: string;
  opciones: { clave: string; nombre: string; que: string }[];
  valor: string;
  alElegir: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      {opciones.map((o) => (
        <label key={o.clave} className={valor === o.clave ? "elegida" : ""}>
          <input
            type="radio"
            name={titulo}
            value={o.clave}
            checked={valor === o.clave}
            onChange={() => alElegir(o.clave)}
          />
          <strong>{o.nombre}</strong>
          <span>{o.que}</span>
        </label>
      ))}
    </fieldset>
  );
}
