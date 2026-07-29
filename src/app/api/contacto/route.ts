import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notificarContacto, enviarAcuse, type MetaSolicitud } from "@/lib/mail";
import { dominioRecibeCorreo, pareceBot } from "@/lib/anti-spam";
import { esCategoriaValida, esSedeValida } from "@/lib/categorias";

// Rate limiting en memoria. OJO: en serverless (Vercel) cada instancia tiene su
// propio Map y las instancias se reciclan, así que el límite es best-effort, no
// una garantía. Para un límite real hace falta un store externo (Vercel KV /
// Upstash). Se deja como primera barrera; el filtro real es honeypot + MX + el
// antispam de Gmail del lado receptor.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora
// Tope de IPs distintas en memoria. Sin esto el Map sólo crece: una entrada
// vencida nunca se borra sola, se sobrescribe recién si esa misma IP vuelve. Con
// tráfico rotando IPs, la instancia se va llenando hasta que la reciclan.
const RATE_MAX_ENTRADAS = 5_000;

/** Saca las ventanas vencidas. Si aun así no baja del tope, vacía y arranca de cero. */
function limpiarRateLimit(now: number) {
  if (rateLimitMap.size < RATE_MAX_ENTRADAS) return;

  for (const [clave, dato] of rateLimitMap) {
    if (now >= dato.resetAt) rateLimitMap.delete(clave);
  }
  // Todas vigentes: es un ataque con IPs rotando. Vaciar es preferible a crecer
  // sin techo — el límite ya es best-effort y perderlo un rato no rompe nada.
  if (rateLimitMap.size >= RATE_MAX_ENTRADAS) rateLimitMap.clear();
}

/** Tope duro antes de procesar nada. Corta payloads absurdos de entrada. */
const TOPE_ABSURDO = 20_000;

/**
 * Campo de una sola línea: sin saltos ni caracteres de control, espacios
 * colapsados y recortado.
 *
 * No es cosmético. `nombre` y `asunto` terminan dentro de cabeceras del correo
 * (`Reply-To`, `Subject`): un `\r\n` en el valor es la receta clásica de
 * inyección de cabeceras. Nodemailer ya escapa, pero no se deja el saneo en
 * manos de una librería cuando cuesta una línea hacerlo acá.
 *
 * El `.trim()` va antes del `min()`: sin eso, un nombre de tres espacios pasaba
 * la validación de largo mínimo.
 */
const unaLinea = (min: number, max: number) =>
  z
    .string()
    .max(TOPE_ABSURDO)
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

/** Texto multilínea: conserva los saltos, saca el resto de los caracteres de control. */
const textoLargo = (min: number, max: number) =>
  z
    .string()
    .max(TOPE_ABSURDO)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().min(min).max(max));

const contactoSchema = z.object({
  nombre: unaLinea(2, 100),
  email: unaLinea(5, 254).pipe(z.string().email()),
  telefono: unaLinea(0, 20).optional(),
  // Se valida contra la lista real de src/content/config.ts, no contra lo que
  // diga el cliente: el <select> del navegador no es una barrera.
  categoria: z.string().refine(esCategoriaValida, "Categoría inválida"),
  asunto: unaLinea(3, 200),
  mensaje: textoLargo(10, 2000),
  // Lista blanca: este valor va a parar a una cabecera del correo.
  sede: z.string().refine(esSedeValida, "Sede inválida").optional(),
  // Antispam — no se muestran al usuario
  companyWebsite: z.string().max(TOPE_ABSURDO).optional(), // honeypot
  tiempoMs: z.number().optional(),        // ms desde que se abrió el form
});

/**
 * Número de solicitud. Sirve para tres cosas: que el apoderado lo cite, que el
 * colegio rastree un mensaje entre el buzón y lo que sea que lo procese, y que
 * un reintento de red se pueda deduplicar en vez de contarse como dos consultas.
 */
function nuevoId(fecha: Date): string {
  const dia = fecha.toISOString().slice(0, 10).replace(/-/g, "");
  const azar = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `GC-${dia}-${azar}`;
}

/**
 * ¿El remitente dice ser del propio dominio del colegio?
 *
 * En ese caso el mensaje se procesa igual (puede ser alguien del colegio
 * escribiendo de verdad), pero NO se manda acuse: iría a una casilla propia y
 * puede realimentarse con las respuestas automáticas del Workspace.
 */
function esDominioPropio(email: string): boolean {
  const propio = (process.env.CONTACTO_FROM || process.env.CONTACTO_TO || "")
    .split("@")[1]
    ?.toLowerCase();
  if (!propio) return false;
  return email.split("@")[1]?.toLowerCase() === propio;
}

/**
 * IP real del cliente.
 *
 * NO se toma el primer token de `x-forwarded-for`: ese header lo puede anteponer
 * el cliente, así que confiar en su primer valor deja evadir el rate-limit
 * (IP nueva por request) y envenenar el log forense. En Vercel, `x-real-ip` y
 * `x-vercel-forwarded-for` los fija la plataforma con la IP que de verdad se
 * conectó, y el cliente no los puede sobrescribir; se prefieren esos.
 *
 * De `x-forwarded-for` sólo se usa el ÚLTIMO valor como respaldo: es el que
 * agrega el proxy más cercano a nuestra infra, no el que inyecta el cliente.
 */
function getClientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const vercel = req.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel.split(",").pop()!.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").pop()!.trim();

  return "unknown";
}

/**
 * Respuesta JSON con `Cache-Control: no-store`.
 *
 * Ninguna respuesta de este endpoint debe cachearse: llevan estado por request
 * (id, resultado del envío, errores) y sus requests tienen cuerpo. Marcar
 * no-store cierra de raíz cualquier confusión de caché en CDN o proxies.
 */
function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Reúne la metadata de origen desde los headers de la request. */
function getMeta(req: NextRequest): MetaSolicitud {
  const h = req.headers;
  return {
    ip: getClientIp(req),
    userAgent: h.get("user-agent") || "—",
    idioma: h.get("accept-language") || "—",
    referer: h.get("referer") || "—",
    // Geolocalización que Vercel inyecta gratis (vacío fuera de Vercel).
    pais: h.get("x-vercel-ip-country") || "",
    ciudad: h.get("x-vercel-ip-city")
      ? decodeURIComponent(h.get("x-vercel-ip-city")!)
      : "",
    fecha: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  limpiarRateLimit(now);
  const rateData = rateLimitMap.get(ip);

  if (rateData) {
    if (now < rateData.resetAt) {
      if (rateData.count >= RATE_LIMIT) {
        return json({ error: "Demasiados mensajes. Intenta en una hora." }, 429);
      }
      rateData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  // Tamaño máximo del body. El formulario legítimo más grande (mensaje 2000 +
  // campos + honeypot) no llega a 8 KB; 32 KB deja margen de sobra. Se corta por
  // Content-Length ANTES de parsear, para no gastar CPU deserializando un JSON
  // gigante. Vercel corta a 4.5 MB, pero eso es demasiado tarde y demasiado alto.
  const largo = Number(req.headers.get("content-length") || 0);
  if (largo > 32_768) {
    return json({ error: "Cuerpo demasiado grande" }, 413);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const result = contactoSchema.safeParse(body);
  if (!result.success) {
    // El detalle de validación (qué campo, qué regla) va al log del server, no
    // al cliente: el formulario ya valida antes de enviar, así que un 400 acá es
    // un cliente manipulado. Devolver el mapa de errores sólo le mapea el
    // esquema a quien lo esté sondeando. Al usuario legítimo le basta el genérico.
    console.warn("[contacto] payload inválido:", result.error.flatten().fieldErrors);
    return json({ error: "Datos inválidos" }, 400);
  }

  const data = result.data;

  // Antispam: bot detectado → responder 201 "ok" para no darle pistas, pero no
  // enviar nada. (Devolver error le enseña al bot qué evitar.)
  //
  // El id va igual, y falso. Si la respuesta del caso filtrado fuera distinta de
  // la del caso real, el propio endpoint le estaría diciendo al atacante cuándo
  // lo detectaron: prueba y error hasta encontrar la combinación que pasa.
  if (pareceBot(data)) {
    return json({ ok: true, id: nuevoId(new Date()) }, 201);
  }

  // Verificar que el dominio del email pueda recibir correo (atrapa typos).
  if (!(await dominioRecibeCorreo(data.email))) {
    return json({ error: "No pudimos verificar ese correo. ¿Está bien escrito?" }, 400);
  }

  const meta = getMeta(req);
  const datos = {
    id: nuevoId(new Date(meta.fecha)),
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    categoria: data.categoria,
    asunto: data.asunto,
    mensaje: data.mensaje,
    sede: data.sede || "—",
  };

  try {
    await notificarContacto(datos, meta);
  } catch {
    return json({ error: "No pudimos enviar tu mensaje. Intenta más tarde." }, 502);
  }

  // El acuse es cortesía: si falla, el mensaje ya llegó al colegio y la consulta
  // no se pierde. No puede tumbar la respuesta al apoderado.
  if (!esDominioPropio(datos.email)) {
    try {
      await enviarAcuse(datos, meta.fecha);
    } catch (e) {
      console.warn(`[mail] acuse no enviado (${datos.id}):`, e);
    }
  }

  return json({ ok: true, id: datos.id }, 201);
}
