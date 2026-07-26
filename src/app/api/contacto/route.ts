import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notificarContacto, type MetaSolicitud } from "@/lib/mail";
import { dominioRecibeCorreo, pareceBot } from "@/lib/anti-spam";

// Rate limiting en memoria. OJO: en serverless (Vercel) cada instancia tiene su
// propio Map y las instancias se reciclan, así que el límite es best-effort, no
// una garantía. Para un límite real hace falta un store externo (Vercel KV /
// Upstash). Se deja como primera barrera; el filtro real es honeypot + MX + el
// antispam de Gmail del lado receptor.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

const contactoSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().max(20).optional(),
  asunto: z.string().min(3).max(200),
  mensaje: z.string().min(10).max(2000),
  sede: z.string().max(20).optional(),
  // Antispam — no se muestran al usuario
  companyWebsite: z.string().optional(), // honeypot
  tiempoMs: z.number().optional(),        // ms desde que se abrió el form
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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
  const rateData = rateLimitMap.get(ip);

  if (rateData) {
    if (now < rateData.resetAt) {
      if (rateData.count >= RATE_LIMIT) {
        return NextResponse.json(
          { error: "Demasiados mensajes. Intenta en una hora." },
          { status: 429 }
        );
      }
      rateData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const result = contactoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Antispam: bot detectado → responder 201 "ok" para no darle pistas, pero no
  // enviar nada. (Devolver error le enseña al bot qué evitar.)
  if (pareceBot(data)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Verificar que el dominio del email pueda recibir correo (atrapa typos).
  if (!(await dominioRecibeCorreo(data.email))) {
    return NextResponse.json(
      { error: "No pudimos verificar ese correo. ¿Está bien escrito?" },
      { status: 400 }
    );
  }

  try {
    await notificarContacto(
      {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        asunto: data.asunto,
        mensaje: data.mensaje,
        sede: data.sede || "—",
      },
      getMeta(req)
    );
  } catch {
    return NextResponse.json(
      { error: "No pudimos enviar tu mensaje. Intenta más tarde." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
