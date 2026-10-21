"use client";

import { useState, useRef, useEffect } from "react";
import { ACCEPT_ADJUNTOS, MAX_ADJUNTOS, MAX_TOTAL_BYTES, formatoMB } from "@/lib/adjuntos";

type FormState = "idle" | "loading" | "success" | "error";

/** Tiene que coincidir con el max del schema en /api/contacto. */
const MAX_MENSAJE = 2000;

interface ContactFormProps {
  sede: "basica" | "media";
  /** Vienen de contacto.categorias en src/content/config.ts, vía page.tsx. */
  categorias: { id: string; label: string; adjuntos?: boolean; aviso_adjuntos?: string }[];
  /** contacto.aviso_privacidad y contacto.consentimiento, vía page.tsx. */
  privacidad: { aviso: string; consentimiento: string };
}

/** Lado mayor de una foto adjunta. Sobra para leer un currículum fotografiado. */
const FOTO_MAX_PX = 2000;
/** Bajo esto, una foto se manda tal cual: comprimirla no gana nada. */
const FOTO_SIN_TOCAR_BYTES = 600 * 1024;

/**
 * Achica una foto antes de subirla. Sin esto, una sola foto de celular (3-6 MB)
 * se come el tope de 4 MB que impone Vercel por request, y tres no entran.
 *
 * Sale como JPEG: es lo que todo cliente de correo abre. `createImageBitmap`
 * con `imageOrientation` respeta la rotación EXIF, así una foto tomada en
 * vertical no llega acostada. Si el navegador no puede decodificarla (HEIC en
 * Android, p. ej.) devuelve null y el formulario lo dice.
 */
async function comprimirFoto(archivo: File): Promise<File | null> {
  if (archivo.size <= FOTO_SIN_TOCAR_BYTES && /^image\/(jpeg|png|webp)$/.test(archivo.type)) {
    return archivo;
  }
  try {
    const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, FOTO_MAX_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Fondo blanco: un PNG con transparencia pasado a JPEG queda negro si no.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob) return null;
    const nombre = archivo.name.replace(/\.[^.]*$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

const DOMINIOS_COMUNES = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
];

/** Distancia de edición ≤2 → probablemente un typo del dominio. */
function sugerirDominio(email: string): string | null {
  const dominio = email.split("@")[1]?.toLowerCase();
  if (!dominio || DOMINIOS_COMUNES.includes(dominio)) return null;

  for (const comun of DOMINIOS_COMUNES) {
    if (distancia(dominio, comun) <= 2 && dominio !== comun) {
      return email.split("@")[0] + "@" + comun;
    }
  }
  return null;
}

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[a.length][b.length];
}

export default function ContactForm({ sede, categorias, privacidad }: ContactFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState("");
  const categoriaActual = categorias.find((c) => c.id === categoria);
  const aceptaAdjuntos = categoriaActual?.adjuntos === true;
  const totalBytes = archivos.reduce((s, f) => s + f.size, 0);
  const emailRef = useRef<HTMLInputElement>(null);
  const exitoRef = useRef<HTMLHeadingElement>(null);
  // Momento en que se montó el form — la trampa de tiempo antibot.
  const abiertoEn = useRef(Date.now());

  // El envío reemplaza el formulario entero por la confirmación. Sin mover el
  // foco, quien navega con teclado o lector de pantalla se queda apuntando a un
  // nodo que ya no existe y no se entera de que el mensaje salió.
  useEffect(() => {
    if (state === "success") exitoRef.current?.focus();
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    // Multipart y no JSON: es la única forma de mandar archivos sin inflarlos
    // un 33% en base64, y ese 33% es justo lo que no sobra bajo el tope de Vercel.
    // Los campos salen del form; los archivos, del estado (ya comprimidos).
    const formData = new FormData(e.currentTarget);
    formData.set("tiempoMs", String(Date.now() - abiertoEn.current));
    if (aceptaAdjuntos) {
      for (const archivo of archivos) formData.append("adjuntos", archivo);
    }

    try {
      // Sin Content-Type a mano: el navegador lo pone con el boundary del multipart.
      const res = await fetch("/api/contacto", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSolicitudId(typeof data.id === "string" ? data.id : null);
        setState("success");
        (e.target as HTMLFormElement).reset();
        // reset() no toca los campos controlados
        setCategoria("");
        setMensaje("");
        setArchivos([]);
      } else if (res.status === 413) {
        setState("error");
        setErrorMsg("Los archivos son demasiado pesados. Prueba con menos archivos o PDF más livianos.");
      } else if (res.status === 429) {
        setState("error");
        setErrorMsg("Demasiados mensajes enviados. Por favor espera un momento.");
      } else {
        const data = await res.json().catch(() => ({}));
        setState("error");
        setErrorMsg(data.error || "Ocurrió un error. Por favor intenta nuevamente.");
      }
    } catch {
      setState("error");
      setErrorMsg("No se pudo conectar. Verifica tu conexión a internet.");
    }
  }

  async function agregarArchivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setErrorArchivo("");
    const nuevos = Array.from(lista);
    if (archivos.length + nuevos.length > MAX_ADJUNTOS) {
      setErrorArchivo(`Puedes adjuntar hasta ${MAX_ADJUNTOS} archivos.`);
      return;
    }
    setProcesando(true);
    const listos: File[] = [];
    for (const archivo of nuevos) {
      const esImagen = archivo.type.startsWith("image/") || /\.(heic|heif)$/i.test(archivo.name);
      const final = esImagen ? await comprimirFoto(archivo) : archivo;
      if (!final) {
        setErrorArchivo(`No pudimos leer "${archivo.name}". Envíala como JPG o PDF.`);
        setProcesando(false);
        return;
      }
      listos.push(final);
    }
    setProcesando(false);
    const total = [...archivos, ...listos].reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setErrorArchivo(
        `Entre todos pesan ${formatoMB(total)} y el máximo es ${formatoMB(MAX_TOTAL_BYTES)}. ` +
          "Prueba con un PDF más liviano o una foto en vez del escaneo."
      );
      return;
    }
    setArchivos((prev) => [...prev, ...listos]);
  }

  if (state === "success") {
    return (
      <div className="py-8 text-center" role="status" aria-live="polite">
        <div className="w-16 h-16 rounded-full bg-gc-success/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gc-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h4
          ref={exitoRef}
          tabIndex={-1}
          className="text-lg font-display font-bold text-gc-green-800 mb-2 outline-none"
        >
          Mensaje enviado
        </h4>
        <p className="text-gc-green-800/60 font-body text-sm mb-2">
          Gracias por escribirnos. Te enviamos una confirmación por correo y te
          responderemos a la brevedad.
        </p>
        {solicitudId && (
          <p className="text-gc-green-800/50 font-body text-xs mb-6">
            N° de solicitud:{" "}
            <span className="font-mono font-semibold text-gc-green-800/70">
              {solicitudId}
            </span>
          </p>
        )}
        <button
          onClick={() => {
            setSolicitudId(null);
            setState("idle");
          }}
          className="btn-ghost text-sm"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="sede" value={sede} />

      {/* Honeypot: invisible para humanos, tentador para bots. Si viene lleno,
          el server descarta el envío. No usar type="hidden" (los bots lo saltan);
          se oculta con CSS y se saca del tab/lectores. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <label>
          No completar este campo
          <input
            type="text"
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombre" className="label-gc">
            Nombre <span className="text-gc-red">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            minLength={2}
            maxLength={100}
            className="input-gc"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="label-gc">
            Email <span className="text-gc-red">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            ref={emailRef}
            onBlur={(e) => setSugerencia(sugerirDominio(e.target.value))}
            onChange={() => sugerencia && setSugerencia(null)}
            className="input-gc"
            placeholder="tu@email.com"
          />
          {sugerencia && (
            <p className="text-xs text-gc-green-800/60 font-body mt-1">
              ¿Quisiste decir{" "}
              <button
                type="button"
                className="text-gc-green font-semibold underline"
                onClick={() => {
                  if (emailRef.current) emailRef.current.value = sugerencia;
                  setSugerencia(null);
                }}
              >
                {sugerencia}
              </button>
              ?
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="telefono" className="label-gc">
            Teléfono <span className="text-gc-green-800/30 text-xs">(opcional)</span>
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            maxLength={20}
            className="input-gc"
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div>
          <label htmlFor="categoria" className="label-gc">
            Motivo <span className="text-gc-red">*</span>
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={`input-gc ${categoria === "" ? "text-gc-gray-500" : ""}`}
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id} className="text-gc-gray-900">
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="asunto" className="label-gc">
          Asunto <span className="text-gc-red">*</span>
        </label>
        <input
          id="asunto"
          name="asunto"
          type="text"
          required
          minLength={3}
          maxLength={200}
          className="input-gc"
          placeholder="¿En qué te podemos ayudar?"
        />
      </div>

      <div>
        <label htmlFor="mensaje" className="label-gc">
          Mensaje <span className="text-gc-red">*</span>
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          minLength={10}
          maxLength={MAX_MENSAJE}
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          aria-describedby="mensaje-contador"
          className="input-gc resize-none"
          placeholder="Escribe tu mensaje aquí..."
        />
        {/* El contador aparece recién cerca del tope: mostrarlo desde el
            carácter cero es ruido, y de paso presiona a escribir corto. */}
        <p
          id="mensaje-contador"
          aria-live="polite"
          className={`text-xs font-body text-right mt-1 transition-opacity duration-200 ${
            mensaje.length > MAX_MENSAJE * 0.75 ? "opacity-100" : "opacity-0"
          } ${
            mensaje.length >= MAX_MENSAJE
              ? "text-gc-red font-semibold"
              : "text-gc-green-800/50"
          }`}
        >
          {mensaje.length >= MAX_MENSAJE
            ? `Llegaste al máximo de ${MAX_MENSAJE} caracteres`
            : `${MAX_MENSAJE - mensaje.length} caracteres disponibles`}
        </p>
      </div>

      {aceptaAdjuntos && (
        <div>
          <span className="label-gc">
            Adjuntar archivos{" "}
            <span className="text-gc-green-800/30 text-xs">
              (opcional · hasta {MAX_ADJUNTOS} · PDF, Word o foto)
            </span>
          </span>
          {categoriaActual?.aviso_adjuntos && (
            <p className="text-xs font-body text-gc-gray-700 bg-gc-cream rounded-lg px-3 py-2 mb-2">
              {categoriaActual.aviso_adjuntos}
            </p>
          )}
          {archivos.length > 0 && (
            <ul className="space-y-1 mb-2">
              {archivos.map((archivo, i) => (
                <li
                  key={`${archivo.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gc-cream px-3 py-2 text-sm font-body"
                >
                  <span className="truncate text-gc-gray-900">{archivo.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gc-gray-500">{formatoMB(archivo.size)}</span>
                    <button
                      type="button"
                      onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))}
                      className="rounded px-1 text-gc-gray-500 transition-colors duration-200 hover:text-gc-red"
                      aria-label={`Quitar ${archivo.name}`}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {archivos.length < MAX_ADJUNTOS && (
            // Zona de arrastre. Es un <label> del input: tocarla abre el selector
            // de archivos, que en celular es lo único que existe (no hay drag
            // and drop en táctil). En escritorio, además, acepta soltar archivos.
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                // dragleave también salta al pasar sobre un hijo: sólo se apaga
                // cuando el puntero sale de verdad de la zona.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastrando(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                if (!procesando) agregarArchivos(e.dataTransfer.files);
              }}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center font-body transition-colors duration-200 focus-within:ring-2 focus-within:ring-gc-gold ${
                arrastrando
                  ? "border-gc-gold bg-gc-gold/10"
                  : "border-gc-gray-200 bg-gc-white hover:border-gc-gold/60 hover:bg-gc-cream"
              } ${procesando ? "pointer-events-none opacity-60" : ""}`}
            >
              <svg className="h-6 w-6 text-gc-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              <span className="text-sm text-gc-gray-900">
                {procesando ? (
                  "Preparando archivo..."
                ) : arrastrando ? (
                  "Suelta los archivos aquí"
                ) : (
                  <>
                    <span className="hidden sm:inline">Arrastra tus archivos aquí o </span>
                    <span className="font-semibold text-gc-gold-dark underline underline-offset-2">
                      <span className="sm:hidden">Elegir archivo</span>
                      <span className="hidden sm:inline">elige un archivo</span>
                    </span>
                  </>
                )}
              </span>
              <span className="text-xs text-gc-gray-500">
                PDF, Word o foto · {MAX_ADJUNTOS - archivos.length} restante
                {MAX_ADJUNTOS - archivos.length === 1 ? "" : "s"}
              </span>
              <input
                type="file"
                multiple
                accept={ACCEPT_ADJUNTOS}
                disabled={procesando}
                className="sr-only"
                onChange={(e) => {
                  agregarArchivos(e.target.files);
                  // Permite volver a elegir el mismo archivo después de quitarlo.
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <p className="text-xs font-body text-gc-green-800/40 mt-1">
            {archivos.length > 0
              ? `${formatoMB(totalBytes)} de ${formatoMB(MAX_TOTAL_BYTES)}. `
              : ""}
            Las fotos se achican solas antes de enviarse.
          </p>
          {errorArchivo && (
            <p role="alert" className="text-xs font-body text-gc-red mt-1">
              {errorArchivo}
            </p>
          )}
        </div>
      )}

      {/* Aviso de privacidad + casilla de consentimiento. Textos del asesor legal
          (ver contacto.aviso_privacidad en src/content/config.ts). Van ANTES del
          botón: la autorización tiene que darse antes de enviar, no leerse después.
          La casilla parte desmarcada y es obligatoria; el server la vuelve a
          exigir y deja la versión del texto aceptado en el correo. */}
      <div className="space-y-3">
        <p className="text-xs text-gc-gray-700 font-body leading-relaxed">
          {privacidad.aviso}
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="consentimiento"
            value="si"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-gc-green-800"
          />
          <span className="text-sm text-gc-gray-900 font-body leading-snug">
            {privacidad.consentimiento}
          </span>
        </label>
      </div>

      {/* role="alert" para que un lector de pantalla anuncie el fallo: sin esto
          el envío falla en silencio para quien no está mirando la pantalla. */}
      {state === "error" && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 font-body text-sm">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "loading" || procesando}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "loading" ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          "Enviar mensaje"
        )}
      </button>
    </form>
  );
}
