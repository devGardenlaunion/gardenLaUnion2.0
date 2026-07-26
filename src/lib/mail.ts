import nodemailer from "nodemailer";

/**
 * Envío de correo del sitio. TODO el envío pasa por acá: el día que se monte
 * n8n, se reemplaza el cuerpo de notificarContacto() por un fetch al webhook y
 * no se toca ni el endpoint ni el formulario.
 *
 * Config por variables de entorno (ver .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  → credenciales del servidor
 *   CONTACTO_FROM                               → dirección que aparece como remitente
 *   CONTACTO_FROM_NAME                          → nombre visible del remitente
 *   CONTACTO_TO                                 → dónde llegan los mensajes
 *
 * `SMTP_USER` NO es la dirección del remitente. Con Gmail coinciden, pero con
 * Resend el usuario es literalmente la palabra "resend" y la dirección sale de
 * `CONTACTO_FROM`. Por eso son variables separadas.
 */

export interface DatosContacto {
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  sede: string;
}

/** Metadata forense — para adjuntar al mail en caso de amenaza/abuso. */
export interface MetaSolicitud {
  ip: string;
  userAgent: string;
  idioma: string;
  referer: string;
  pais: string;
  ciudad: string;
  fecha: string;
}

let transportCache: nodemailer.Transporter | null = null;

/** Devuelve el transport, o null si falta configuración SMTP. */
function getTransport(): nodemailer.Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transportCache) {
    const port = Number(SMTP_PORT) || 587;
    transportCache = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL directo; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transportCache;
}

/**
 * Dirección del remitente.
 *
 * Prioridad: `CONTACTO_FROM`; si no está, `SMTP_USER` **sólo si es un email**
 * (caso Gmail/Workspace, donde usuario y remitente son lo mismo). Con Resend
 * `SMTP_USER` vale "resend", así que no sirve como dirección.
 *
 * El dominio tiene que estar verificado en el proveedor o el correo se rechaza.
 */
function getRemitente(): string | null {
  const desde = process.env.CONTACTO_FROM?.trim();
  if (desde?.includes("@")) return desde;

  const usuario = process.env.SMTP_USER?.trim();
  if (usuario?.includes("@")) return usuario;

  return null;
}

/** Dónde llegan los mensajes. Sin esto no hay a quién avisarle. */
function getDestino(): string | null {
  const to = process.env.CONTACTO_TO?.trim();
  if (to?.includes("@")) return to;

  // Último recurso: si el remitente es una casilla real, avisarse a sí misma.
  return getRemitente();
}

/** True si el envío de correo está configurado y utilizable. */
export function mailConfigurado(): boolean {
  return getTransport() !== null && !!getRemitente() && !!getDestino();
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Notifica un nuevo mensaje de contacto.
 *
 * El correo SALE desde la cuenta autenticada (Gmail reescribe el remitente sí o
 * sí), pero el Reply-To es el email del apoderado: al apretar "Responder" en el
 * cliente de correo, se le responde directo a la persona.
 */
export async function notificarContacto(
  datos: DatosContacto,
  meta: MetaSolicitud
): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    // Sin SMTP configurado no se pierde el mensaje en silencio: queda en el log
    // del server para no romper el formulario mientras se cargan las credenciales.
    console.warn(
      "[mail] SMTP no configurado — mensaje NO enviado:",
      JSON.stringify({ ...datos, ip: meta.ip })
    );
    throw new Error("mail-no-configurado");
  }

  const remitente = getRemitente();
  const to = getDestino();
  if (!remitente || !to) {
    console.warn(
      "[mail] Falta CONTACTO_FROM o CONTACTO_TO — mensaje NO enviado:",
      JSON.stringify({ ...datos, ip: meta.ip })
    );
    throw new Error("mail-sin-direcciones");
  }

  const fromName = process.env.CONTACTO_FROM_NAME || "Garden College Web";
  const from = `"${fromName}" <${remitente}>`;

  const forense = [
    `IP:        ${meta.ip}`,
    `Ubicación: ${[meta.ciudad, meta.pais].filter(Boolean).join(", ") || "—"}`,
    `Navegador: ${meta.userAgent}`,
    `Idioma:    ${meta.idioma}`,
    `Origen:    ${meta.referer || "—"}`,
    `Fecha:     ${meta.fecha}`,
  ].join("\n");

  const texto = [
    `Nuevo mensaje desde el formulario de contacto (sede ${datos.sede}).`,
    ``,
    `Nombre:   ${datos.nombre}`,
    `Email:    ${datos.email}`,
    `Teléfono: ${datos.telefono || "—"}`,
    `Asunto:   ${datos.asunto}`,
    ``,
    `Mensaje:`,
    datos.mensaje,
    ``,
    `— — — — — — — — — — — — — — — —`,
    `Datos de origen (para eventual reporte de abuso):`,
    forense,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px">
      <p style="color:#4A4640">Nuevo mensaje desde el formulario de contacto
        (sede <strong>${esc(datos.sede)}</strong>).</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:4px 8px;color:#8A8578">Nombre</td><td style="padding:4px 8px"><strong>${esc(datos.nombre)}</strong></td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Email</td><td style="padding:4px 8px">${esc(datos.email)}</td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Teléfono</td><td style="padding:4px 8px">${esc(datos.telefono || "—")}</td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Asunto</td><td style="padding:4px 8px">${esc(datos.asunto)}</td></tr>
      </table>
      <p style="white-space:pre-wrap;color:#2A2825;background:#F5F0E8;padding:16px;border-radius:8px">${esc(datos.mensaje)}</p>
      <pre style="font-size:11px;color:#8A8578;border-top:1px solid #E0DCD4;padding-top:12px;margin-top:24px;white-space:pre-wrap">${esc(forense)}</pre>
    </div>`;

  await transport.sendMail({
    from,
    to,
    replyTo: `"${datos.nombre}" <${datos.email}>`,
    subject: `[Contacto ${datos.sede}] ${datos.asunto}`,
    text: texto,
    html,
  });
}
