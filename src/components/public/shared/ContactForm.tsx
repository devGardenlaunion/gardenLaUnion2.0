"use client";

import { useState, useRef } from "react";

type FormState = "idle" | "loading" | "success" | "error";

interface ContactFormProps {
  sede: "basica" | "media";
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

export default function ContactForm({ sede }: ContactFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Momento en que se montó el form — la trampa de tiempo antibot.
  const abiertoEn = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const body = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string || undefined,
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
        setState("success");
        (e.target as HTMLFormElement).reset();
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
      <div className="py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gc-success/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gc-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h4 className="text-lg font-display font-bold text-gc-green-800 mb-2">
          Mensaje enviado
        </h4>
        <p className="text-gc-green-800/60 font-body text-sm mb-6">
          Gracias por escribirnos. Te responderemos a la brevedad.
        </p>
        <button
          onClick={() => setState("idle")}
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
          maxLength={2000}
          rows={4}
          className="input-gc resize-none"
          placeholder="Escribe tu mensaje aquí..."
        />
      </div>

      {state === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
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

      {/* Aviso de privacidad. TODO legal: validar el texto con la Ley 19.628
          (datos personales) antes de publicar — se registra IP y ubicación. */}
      <p className="text-xs text-gc-green-800/40 font-body text-center leading-relaxed">
        Al enviar aceptas que registremos los datos del formulario y datos
        técnicos de tu conexión (IP, ubicación aproximada) para responder tu
        consulta y prevenir abusos.
      </p>
    </form>
  );
}
