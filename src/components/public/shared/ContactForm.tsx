"use client";

import { useState, useRef, useEffect } from "react";

type FormState = "idle" | "loading" | "success" | "error";

/** Tiene que coincidir con el max del schema en /api/contacto. */
const MAX_MENSAJE = 2000;

interface ContactFormProps {
  sede: "basica" | "media";
  /** Vienen de contacto.categorias en src/content/config.ts, vía page.tsx. */
  categorias: { id: string; label: string }[];
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

export default function ContactForm({ sede, categorias }: ContactFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sugerencia, setSugerencia] = useState<string | null>(null);
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

    const formData = new FormData(e.currentTarget);
    const body = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string || undefined,
      categoria: formData.get("categoria") as string,
      asunto: formData.get("asunto") as string,
      mensaje: formData.get("mensaje") as string,
      sede: formData.get("sede") as string,
      // Antispam
      companyWebsite: (formData.get("companyWebsite") as string) || "",
      tiempoMs: Date.now() - abiertoEn.current,
    };

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSolicitudId(typeof data.id === "string" ? data.id : null);
        setState("success");
        (e.target as HTMLFormElement).reset();
        // reset() no toca los campos controlados
        setCategoria("");
        setMensaje("");
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

      {/* role="alert" para que un lector de pantalla anuncie el fallo: sin esto
          el envío falla en silencio para quien no está mirando la pantalla. */}
      {state === "error" && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 font-body text-sm">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
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

      {/* Aviso de privacidad. Cubre finalidad + tipo de dato, que es el mínimo
          exigible. TODO legal antes de publicar: validar con un abogado a la luz
          de la Ley 21.719 (moderniza la 19.628, vigencia dic-2026, estándar
          tipo-GDPR). Falta definir por el colegio, no por código: responsable
          del tratamiento, base de licitud, plazo de retención y una política de
          privacidad enlazable con el derecho de acceso/rectificación/supresión.
          Ver docs/BLUE_TEAM.md → Cumplimiento. */}
      <p className="text-xs text-gc-green-800/40 font-body text-center leading-relaxed">
        Al enviar aceptas que registremos los datos del formulario y datos
        técnicos de tu conexión (IP, ubicación aproximada) para responder tu
        consulta y prevenir abusos. No los usamos para ningún otro fin ni los
        compartimos. Puedes pedir su eliminación escribiéndonos.
      </p>
    </form>
  );
}
