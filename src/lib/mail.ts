import nodemailer from "nodemailer";
import { contenido } from "@/content/config";
import { labelCategoria } from "./categorias";

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
  /** Identificador de la solicitud. Va en el asunto, en X-GC-Id y en el acuse. */
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  /** id de categoría, ya validado contra src/content/config.ts. */
  categoria: string;
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

/** Nombre legible de la sede, desde el contenido. Cae al id si no lo encuentra. */
function labelSede(sede: string): string {
  const c = contenido as Record<string, unknown>;
  const nombre = c[`contacto.sede_${sede}.nombre`];
  return typeof nombre === "string" ? nombre : sede;
}

/** Fecha en horario de Chile — el ISO en UTC no le sirve a nadie del colegio. */
function fechaChile(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

/**
 * Recorte del mensaje para el acuse, en límite de palabra.
 *
 * Es **extracción, no generación**: el apoderado reconoce lo que escribió y no
 * hay ningún modelo de por medio. Si esto lo redactara una IA, el colegio
 * estaría mandando texto generado sin que nadie lo revise, y encima expuesto a
 * que el propio mensaje traiga instrucciones — justo lo que prohíbe la regla de
 * aprobación humana en CLAUDE.md.
 */
function resumen(texto: string, max = 200): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;

  const corte = limpio.slice(0, max);
  const ultimoEspacio = corte.lastIndexOf(" ");
  return (ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte) + "…";
}

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

  const forense = [
    `IP:        ${meta.ip}`,
    `Ubicación: ${[meta.ciudad, meta.pais].filter(Boolean).join(", ") || "—"}`,
    `Navegador: ${meta.userAgent}`,
    `Idioma:    ${meta.idioma}`,
    `Origen:    ${meta.referer || "—"}`,
    `Fecha:     ${meta.fecha}`,
  ].join("\n");

  const categoriaLabel = labelCategoria(datos.categoria);
  const sedeLabel = labelSede(datos.sede);

  // Bloque legible por máquina. Sin esto, cualquier triage automático tiene que
  // reparsear la prosa del correo — trabajo y errores gratis. Va delimitado y en
  // el texto plano; el contenido del apoderado queda dentro de un valor JSON, no
  // suelto entre las instrucciones de quien lo procese.
  const datosJson = JSON.stringify(
    {
      id: datos.id,
      version: 1,
      origen: "formulario-web",
      recibido: meta.fecha,
      categoria: datos.categoria,
      sede: datos.sede,
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono || null,
      asunto: datos.asunto,
      mensaje: datos.mensaje,
    },
    null,
    2
  );

  const texto = [
    `Nuevo mensaje desde el formulario de contacto.`,
    ``,
    `Solicitud: ${datos.id}`,
    `Categoría: ${categoriaLabel}`,
    `Sede:      ${sedeLabel}`,
    `Fecha:     ${fechaChile(meta.fecha)}`,
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
    ``,
    // El delimitador lleva el id de la solicitud, que también viaja en X-GC-Id.
    // Si fuera una marca fija, cualquiera podría escribir un bloque falso dentro
    // del mensaje y quien parsee el correo se comería ese en vez del real: un
    // atacante eligiendo qué categoría, qué remitente y qué texto ve el triage.
    // Con el id adentro tiene que adivinarlo, y se genera después de leerlo.
    `--- GC-JSON ${datos.id} ---`,
    datosJson,
    `--- FIN GC-JSON ${datos.id} ---`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px">
      <p style="color:#4A4640">Nuevo mensaje desde el formulario de contacto
        (<strong>${esc(categoriaLabel)}</strong> — ${esc(sedeLabel)}).</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:4px 8px;color:#8A8578">Solicitud</td><td style="padding:4px 8px"><code>${esc(datos.id)}</code></td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Nombre</td><td style="padding:4px 8px"><strong>${esc(datos.nombre)}</strong></td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Email</td><td style="padding:4px 8px">${esc(datos.email)}</td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Teléfono</td><td style="padding:4px 8px">${esc(datos.telefono || "—")}</td></tr>
        <tr><td style="padding:4px 8px;color:#8A8578">Asunto</td><td style="padding:4px 8px">${esc(datos.asunto)}</td></tr>
      </table>
      <p style="white-space:pre-wrap;color:#2A2825;background:#F5F0E8;padding:16px;border-radius:8px">${esc(datos.mensaje)}</p>
      <pre style="font-size:11px;color:#8A8578;border-top:1px solid #E0DCD4;padding-top:12px;margin-top:24px;white-space:pre-wrap">${esc(forense)}</pre>
    </div>`;

  await transport.sendMail({
    // Direcciones como objetos {name, address}: nodemailer codifica el nombre
    // (RFC 2047) y valida la dirección por separado. Interpolarlas en un string
    // dejaba que un nombre con `"`/`<`/`>` alterara la estructura del header —
    // el saneo del endpoint quita saltos de línea, pero no esos caracteres.
    from: { name: fromName, address: remitente },
    to,
    replyTo: { name: datos.nombre, address: datos.email },
    // El asunto lleva categoría y sede al frente para que un filtro de Gmail
    // pueda etiquetar sin leer el cuerpo ni depender de ningún procesamiento.
    subject: `[${datos.categoria}][${datos.sede}] ${datos.asunto}`,
    // Las mismas claves como cabeceras: es lo que hace filtrable el correo de
    // forma determinista, funcione o no el triage automático que venga después.
    headers: {
      "X-GC-Id": datos.id,
      "X-GC-Categoria": datos.categoria,
      "X-GC-Sede": datos.sede,
      "X-GC-Origen": "formulario-web",
    },
    text: texto,
    html,
  });
}

/**
 * Acuse de recibo al apoderado. Confirma que el mensaje llegó y le deja el
 * número de solicitud; NO es la respuesta a su consulta.
 *
 * Decisiones que no son cosméticas:
 *
 *  - **Corto y sin repetir el mensaje completo.** El formulario es público:
 *    cualquiera puede poner el correo de un tercero y texto arbitrario, y el
 *    acuse se lo entregaría desde un dominio con buena reputación. Mandando
 *    sólo un extracto y sin convertir nada en enlaces, el formulario deja de
 *    servir como vehículo para hacerle llegar un mensaje a alguien.
 *  - **Reply-To al buzón que lee una persona**, no a la casilla técnica que
 *    autentica el SMTP: si el apoderado responde el acuse —lo va a hacer—,
 *    tiene que caer donde alguien lo vea.
 *  - **`Auto-Submitted: auto-generated`** (RFC 3834) para que no dispare
 *    respuestas automáticas del otro lado y no se arme un ciclo.
 *  - **Sin marca de prioridad alta.** Gmail ignora `Importance`/`X-Priority`
 *    (su marcador "Importante" lo decide el receptor), y ponérsela a un correo
 *    automático sólo ayuda a que termine en Promociones o en spam.
 *
 * Falla en silencio: que el acuse no salga no puede romper el envío al colegio,
 * que es lo único que no se puede perder.
 */
export async function enviarAcuse(datos: DatosContacto, fechaIso: string): Promise<void> {
  const transport = getTransport();
  const remitente = getRemitente();
  if (!transport || !remitente) return;

  const fromName = process.env.CONTACTO_FROM_NAME || "Garden College Web";
  const responderA = getDestino() || remitente;
  const colegio =
    (contenido as Record<string, unknown>)["institucional.nombre_colegio"] ||
    "Garden College";

  const extracto = resumen(datos.mensaje);
  const fecha = fechaChile(fechaIso);
  const categoriaLabel = labelCategoria(datos.categoria);
  const sedeLabel = labelSede(datos.sede);

  const texto = [
    `Hola ${datos.nombre}:`,
    ``,
    `Recibimos tu mensaje. Ya ingresó a nuestro sistema y está siendo procesado;`,
    `te responderemos a este mismo correo.`,
    ``,
    `Resumen de lo que recibimos`,
    `  N° de solicitud : ${datos.id}`,
    `  Fecha           : ${fecha}`,
    `  Categoría       : ${categoriaLabel}`,
    `  Sede            : ${sedeLabel}`,
    `  Asunto          : ${datos.asunto}`,
    `  Tu mensaje      : ${extracto}`,
    ``,
    `— — — — — — — — — — — — — — — —`,
    `Este es un aviso automático de recepción, no una respuesta a tu consulta.`,
    `Si necesitas agregar algo, puedes responder a este correo.`,
    ``,
    `${colegio} — La Unión`,
  ].join("\n");

  const fila = (k: string, v: string) =>
    `<tr><td style="padding:4px 8px;color:#8A8578;white-space:nowrap">${k}</td>` +
    `<td style="padding:4px 8px;color:#2A2825">${esc(v)}</td></tr>`;

  // Sin <a> en ninguna parte: el extracto es texto de un desconocido y no se
  // convierte en enlace ni aunque traiga una URL.
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;color:#2A2825">
      <p>Hola <strong>${esc(datos.nombre)}</strong>:</p>
      <p style="color:#4A4640">Recibimos tu mensaje. Ya ingresó a nuestro sistema
        y está siendo procesado; te responderemos a este mismo correo.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;background:#F5F0E8;border-radius:8px">
        ${fila("N° de solicitud", datos.id)}
        ${fila("Fecha", fecha)}
        ${fila("Categoría", categoriaLabel)}
        ${fila("Sede", sedeLabel)}
        ${fila("Asunto", datos.asunto)}
        ${fila("Tu mensaje", extracto)}
      </table>
      <p style="font-size:12px;color:#8A8578;border-top:1px solid #E0DCD4;padding-top:12px">
        Este es un aviso automático de recepción, no una respuesta a tu consulta.
        Si necesitas agregar algo, puedes responder a este correo.<br>
        <strong>${esc(String(colegio))}</strong> — La Unión
      </p>
    </div>`;

  await transport.sendMail({
    // Estructurado igual que en notificarContacto: el `to` es la dirección del
    // apoderado, que es input; que nodemailer la valide y codifique el nombre.
    from: { name: fromName, address: remitente },
    to: { name: datos.nombre, address: datos.email },
    replyTo: responderA,
    subject: `Recibimos tu mensaje — ${colegio}`,
    headers: {
      "X-GC-Id": datos.id,
      "X-GC-Tipo": "acuse-recibo",
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
    },
    text: texto,
    html,
  });
}
