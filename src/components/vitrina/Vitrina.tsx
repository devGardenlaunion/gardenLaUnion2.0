"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Expand,
  Globe,
  HeartPulse,
  MapPin,
  MonitorSmartphone,
  Pause,
  Play,
  Repeat,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import IconoRed, { type Red } from "@/components/public/shared/IconoRed";

/**
 * La vitrina que corre (traída de gcadmin, 2026-11-23). Recibe los pasos ya armados en el build
 * (`src/lib/vitrina/guion.js`, desde `src/app/vitrina/page.tsx`).
 *
 * **Red** («wifi, en el peor de los casos 4G: un loading y después loop»): antes de la primera vuelta baja cada foto y
 * video a la memoria (`blob:`), con su avance a la vista; desde ahí no vuelve a pedir nada. Lo que no se pudo bajar se
 * pide en vivo.
 *
 * **Cada foto con su fondo**: la misma foto, desenfocada, llena la pantalla y encima va entera (`contain`): recortadas
 * a pantalla completa se cortaban cabezas. En la pantalla **vertical** (tótem) la disposición la cambia el CSS
 * (`.vitrina.vertical`) y el guion prefiere fotos verticales.
 *
 * Entre pasos, un fundido al azul del colegio. La pantalla no se apaga mientras corre (Wake Lock). Controles y cursor
 * aparecen al mover el mouse o tocar, y se van solos.
 */

/* eslint-disable @next/next/no-img-element -- fotos ya bajadas como `blob:`: next/image no aplica. */

type Paso = Record<string, any> & { tipo: string; segundos: number };
export type Guiones = Record<string, Record<string, { pasos: Paso[]; archivos: string[] }>>;

const ICONOS: Record<string, typeof ShieldCheck> = {
  "book-open": BookOpen,
  "heart-pulse": HeartPulse,
  globe: Globe,
  "shield-check": ShieldCheck,
  users: Users,
};
const FUNDIDO_MS = 600;
const A_LA_VEZ = 4;

export default function Vitrina({
  guiones,
  qr,
  version,
  pantalla,
  blobs,
  alCambiar,
  alSalir,
}: {
  guiones: Guiones;
  qr: string;
  version: string;
  pantalla: string;
  blobs: Map<string, string>;
  alCambiar: (version: string, pantalla: string) => void;
  alSalir: () => void;
}) {
  const { pasos, archivos } = guiones[version][pantalla];
  const [cargados, setCargados] = useState(0);
  const [listo, setListo] = useState(false);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [controles, setControles] = useState(true);
  const pausa = useRef(false);
  const cambiando = useRef(false);
  const transcurrido = useRef(0);
  const video = useRef<HTMLVideoElement>(null);
  const n = pasos.length;

  const fuente = useCallback(
    (ruta?: string | null) => (ruta ? (blobs.get(ruta) ?? encodeURI(ruta)) : undefined),
    [blobs],
  );

  // 1. Bajar lo que falta, de a cuatro (al cambiar de versión, solo lo nuevo).
  useEffect(() => {
    let vivo = true;
    const cola = archivos.filter((r) => !blobs.has(r));
    setCargados(archivos.length - cola.length);
    setListo(false);
    setI(0);
    transcurrido.current = 0;
    const uno = async () => {
      while (vivo && cola.length) {
        const ruta = cola.shift()!;
        try {
          const r = await fetch(encodeURI(ruta));
          if (r.ok && vivo) blobs.set(ruta, URL.createObjectURL(await r.blob()));
        } catch {
          // Sin red o sin el archivo: se pedirá en vivo.
        }
        if (vivo) setCargados((c) => c + 1);
      }
    };
    Promise.all(Array.from({ length: A_LA_VEZ }, uno)).then(() => {
      if (!vivo) return;
      setListo(true);
      setVisible(true);
    });
    return () => {
      vivo = false;
    };
  }, [archivos, blobs]);

  const ir = useCallback(
    (d: number) => {
      if (cambiando.current) return;
      cambiando.current = true;
      setVisible(false);
      setTimeout(() => {
        transcurrido.current = 0;
        setI((x) => (((x + d) % n) + n) % n);
        setVisible(true);
        cambiando.current = false;
      }, FUNDIDO_MS);
    },
    [n],
  );

  // 2. El reloj: cuenta solo sin pausa; al cumplirse el tiempo del paso, el siguiente.
  useEffect(() => {
    if (!listo) return;
    const t = setInterval(() => {
      if (pausa.current || cambiando.current) return;
      transcurrido.current += 200;
      if (transcurrido.current >= pasos[i].segundos * 1000) ir(1);
    }, 200);
    return () => clearInterval(t);
  }, [listo, i, pasos, ir]);

  const alternarPausa = useCallback(() => {
    pausa.current = !pausa.current;
    setPausado(pausa.current);
    const v = video.current;
    if (v) pausa.current ? v.pause() : v.play().catch(() => {});
  }, []);

  // Teclado, mouse o toque, y que la pantalla no se apague.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let candado: WakeLockSentinel | null = null;
    const mostrar = () => {
      setControles(true);
      clearTimeout(t);
      t = setTimeout(() => setControles(false), 3000);
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        alternarPausa();
      } else if (e.key === "ArrowRight") ir(1);
      else if (e.key === "ArrowLeft") ir(-1);
      else if (e.key === "f" || e.key === "F") pantallaCompleta();
    };
    const pedirCandado = async () => {
      try {
        if (document.visibilityState === "visible") candado = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Sin Wake Lock: la pantalla sigue la configuración del equipo.
      }
    };
    mostrar();
    pedirCandado();
    window.addEventListener("mousemove", mostrar);
    window.addEventListener("pointerdown", mostrar);
    window.addEventListener("keydown", teclas);
    document.addEventListener("visibilitychange", pedirCandado);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", mostrar);
      window.removeEventListener("pointerdown", mostrar);
      window.removeEventListener("keydown", teclas);
      document.removeEventListener("visibilitychange", pedirCandado);
      candado?.release().catch(() => {});
    };
  }, [ir, alternarPausa]);

  const paso = pasos[i];
  const otraVersion = version === "corta" ? "larga" : "corta";
  const otraPantalla = pantalla === "vertical" ? "horizontal" : "vertical";

  return (
    <div className={`vitrina ${pantalla}${controles ? "" : " sin-cursor"}`}>
      {listo ? (
        <div
          key={`${version}-${pantalla}-${i}`}
          className={`vitrina-paso${visible ? " visible" : ""}${pausado ? " en-pausa" : ""}`}
          style={{ "--dura": `${paso.segundos}s` } as React.CSSProperties}
        >
          <PasoDeLaVitrina paso={paso} fuente={fuente} qr={qr} video={video} alTerminar={() => ir(1)} />
          <div className="vitrina-avance" />
        </div>
      ) : (
        <div className="vitrina-carga">
          <h1>Preparando la vitrina…</h1>
          <p>
            Bajando fotos y videos: {cargados} de {archivos.length}. Después corre sola, aunque se corte la señal.
          </p>
          <div className="vitrina-barra">
            <span style={{ width: `${(cargados / Math.max(1, archivos.length)) * 100}%` }} />
          </div>
        </div>
      )}

      {controles && (
        <div className="vitrina-controles">
          <button type="button" onClick={pantallaCompleta}>
            <Expand size={18} aria-hidden /> Pantalla completa
          </button>
          {listo && (
            <>
              <button type="button" onClick={alternarPausa}>
                {pausado ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
                {pausado ? "Seguir" : "Pausa"}
              </button>
              <button type="button" onClick={() => ir(-1)}>
                <ChevronLeft size={18} aria-hidden /> Anterior
              </button>
              <button type="button" onClick={() => ir(1)}>
                <ChevronRight size={18} aria-hidden /> Siguiente
              </button>
              <span className="vitrina-cuenta">
                {i + 1} / {n}
              </span>
            </>
          )}
          <button type="button" onClick={() => alCambiar(otraVersion, pantalla)}>
            <Repeat size={18} aria-hidden /> Versión {otraVersion}
          </button>
          <button type="button" onClick={() => alCambiar(version, otraPantalla)}>
            <MonitorSmartphone size={18} aria-hidden /> Pantalla {otraPantalla}
          </button>
          <button type="button" onClick={alSalir}>
            <X size={18} aria-hidden /> Salir
          </button>
        </div>
      )}
    </div>
  );
}

function pantallaCompleta() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.();
}

/** La foto entera sobre ella misma desenfocada. */
function Foto({ src, clase = "" }: { src?: string; clase?: string }) {
  return (
    <div className={`vitrina-foto ${clase}`}>
      <img className="vitrina-foto-fondo" src={src} alt="" aria-hidden />
      <img className="vitrina-foto-frente" src={src} alt="" />
    </div>
  );
}

/** Varias fotos de un nivel a la vez: la primera grande y las demás al lado, recortadas (`cover`). */
function Mosaico({ fotos, fuente, grande = false }: { fotos: string[]; fuente: Fuente; grande?: boolean }) {
  return (
    <div className={`vitrina-mosaico${grande ? " grande" : ""}`} data-cuantas={fotos.length}>
      {fotos.map((f) => (
        <img key={f} src={fuente(f)} alt="" />
      ))}
    </div>
  );
}

/** El QR con el león al centro. Corrección alta (H, aguanta ~30 % tapado) y el escudo tapa menos: se sigue leyendo. */
function QrConLeon({ qr, leon }: { qr: string; leon?: string }) {
  return (
    <div className="vitrina-qr-caja">
      {/* SVG generado por `qrcode` en scripts/vitrina-contenido.mjs, no viene de un usuario. */}
      <div dangerouslySetInnerHTML={{ __html: qr }} />
      <img className="vitrina-qr-leon" src={leon} alt="" />
    </div>
  );
}

function Cartel({ rotulo, titulo, texto }: { rotulo?: string; titulo?: string; texto?: string }) {
  if (!rotulo && !titulo && !texto) return null;
  return (
    <div className="vitrina-cartel">
      {rotulo && <span className="vitrina-rotulo">{rotulo}</span>}
      {titulo && <h2>{titulo}</h2>}
      {texto && <p>{texto}</p>}
    </div>
  );
}

type Fuente = (ruta?: string | null) => string | undefined;

function PasoDeLaVitrina({
  paso: p,
  fuente,
  qr,
  video,
  alTerminar,
}: {
  paso: Paso;
  fuente: Fuente;
  qr: string;
  video: React.RefObject<HTMLVideoElement | null>;
  alTerminar: () => void;
}) {
  switch (p.tipo) {
    case "portada":
      return (
        <div className="vitrina-centro">
          <div className="vitrina-logos">
            <img className="vitrina-logo" src={fuente(p.escudo)} alt="" />
            <img className="vitrina-logo" src={fuente(p.logo)} alt="" />
          </div>
          <h1 className="vitrina-titulo-grande">{p.nombre}</h1>
          <p className="vitrina-slogan">{p.slogan}</p>
          <p className="vitrina-rotulo">{p.ciudad}</p>
        </div>
      );
    case "video":
      return (
        <>
          {/* En el tótem el video (16:9) es una franja: el póster desenfocado llena el resto. */}
          {p.poster && <img className="vitrina-video-fondo" src={fuente(p.poster)} alt="" aria-hidden />}
          <video
            ref={video}
            className="vitrina-video"
            src={fuente(p.src)}
            poster={fuente(p.poster)}
            autoPlay
            muted
            playsInline
            onEnded={alTerminar}
          />
          <Cartel rotulo={p.rotulo} titulo={p.titulo} texto={p.texto} />
        </>
      );
    case "foto":
      return (
        <>
          <Foto src={fuente(p.src)} clase="lento" />
          <Cartel rotulo={p.rotulo} titulo={p.titulo} />
        </>
      );
    case "lamina":
      return (
        <>
          {p.fondo && <img className="vitrina-velo-foto" src={fuente(p.fondo)} alt="" />}
          <div className="vitrina-centro vitrina-lamina">
            <span className="vitrina-rotulo">{p.rotulo}</span>
            {p.titulo && <h2>{p.titulo}</h2>}
            <p className={p.texto.length > 260 ? "largo" : ""}>{p.texto}</p>
          </div>
        </>
      );
    case "cifra":
      return (
        <div className="vitrina-centro">
          <span className="vitrina-cifra">{p.cifra}</span>
          <p className="vitrina-slogan">{p.texto}</p>
        </div>
      );
    case "sellos":
      return (
        <div className="vitrina-centro">
          <span className="vitrina-rotulo">Nuestros sellos</span>
          <h2 className="vitrina-titulo-medio">{p.titulo}</h2>
          <ul className="vitrina-sellos">
            {p.tarjetas.map((t: { titulo: string; icono: string }) => {
              const Icono = ICONOS[t.icono] ?? ShieldCheck;
              return (
                <li key={t.titulo}>
                  <Icono aria-hidden />
                  <span>{t.titulo}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    case "sello": {
      const Icono = ICONOS[p.icono] ?? ShieldCheck;
      return (
        <div className="vitrina-mitades">
          <Foto src={fuente(p.foto)} clase="lento" />
          <div className="vitrina-mitad-texto">
            <Icono className="vitrina-icono" aria-hidden />
            <span className="vitrina-rotulo">Nuestros sellos</span>
            <h2>{p.titulo}</h2>
            <p>{p.descripcion}</p>
          </div>
        </div>
      );
    }
    case "niveles":
      return (
        <div className="vitrina-niveles-todos">
          <div className="vitrina-niveles">
            {p.niveles.map((nv: Paso) => (
              <figure key={nv.slug}>
                <Mosaico fotos={nv.fotos} fuente={fuente} />
                <figcaption>
                  <h2>{nv.nombre}</h2>
                  <p>{nv.niveles}</p>
                  <p className="vitrina-sede">
                    <MapPin size="1em" aria-hidden /> {nv.sedeNombre ?? nv.sede}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
          {p.extras && (
            <ul className="vitrina-extras">
              {p.extras.map((x: string) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      );
    case "nivel":
      return (
        <div className="vitrina-mitades">
          <Mosaico fotos={p.fotos} fuente={fuente} grande />
          <div className="vitrina-mitad-texto">
            <span className="vitrina-rotulo">{p.niveles}</span>
            <h2>{p.nombre}</h2>
            <p>{p.descripcion}</p>
            <p className="vitrina-sede">
              <MapPin size="1em" aria-hidden />
              <span>
                {p.sedeNombre && <strong>{p.sedeNombre}</strong>} {p.sede}, La Unión
              </span>
            </p>
          </div>
        </div>
      );
    case "lista":
      return (
        <div className="vitrina-centro vitrina-lamina">
          <span className="vitrina-rotulo">{p.rotulo}</span>
          <h2>{p.titulo}</h2>
          <ul className="vitrina-lista">
            {p.items.map((x: string) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      );
    case "redes":
      return (
        <div className="vitrina-cierre">
          <div className="vitrina-qr">
            <QrConLeon qr={qr} leon={fuente(p.escudo)} />
            <strong>{p.sitio}</strong>
          </div>
          <div className="vitrina-mitad-texto">
            <span className="vitrina-rotulo">Síguenos</span>
            <h2>Nuestras redes</h2>
            <ul className="vitrina-redes">
              {p.redes.map((r: { red: Red; nombre: string; usuario?: string }) => (
                <li key={r.red}>
                  {/* Los mismos logos del Footer y de /enlaces. */}
                  <IconoRed red={r.red} className="vitrina-red-icono" />
                  <strong>{r.nombre}</strong>
                  {r.usuario && <span>{r.usuario}</span>}
                </li>
              ))}
            </ul>
            <p>Escanea el código: redes, admisión y contacto en un solo lugar.</p>
          </div>
        </div>
      );
    case "cierre":
      return (
        <div className="vitrina-cierre">
          <div className="vitrina-qr">
            <QrConLeon qr={qr} leon={fuente(p.escudo)} />
            <strong>{p.sitio}</strong>
          </div>
          <div className="vitrina-mitad-texto">
            <span className="vitrina-rotulo">Admisión</span>
            <h2>Conócenos</h2>
            <p>{p.admision}</p>
            <ul className="vitrina-sedes">
              {p.sedes.map((s: { nombre: string; direccion: string; niveles: string }) => (
                <li key={s.nombre}>
                  <strong>{s.nombre}</strong>
                  <span>
                    {s.direccion} · {s.niveles}
                  </span>
                </li>
              ))}
            </ul>
            {p.redes?.length > 0 && (
              <ul className="vitrina-redes-cierre" aria-label="Nuestras redes">
                {p.redes.map((r: { red: Red; nombre: string; usuario?: string }) => (
                  <li key={r.red}>
                    <IconoRed red={r.red} className="vitrina-red-icono" />
                    <span>{r.usuario ?? r.nombre}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    default:
      return null;
  }
}
