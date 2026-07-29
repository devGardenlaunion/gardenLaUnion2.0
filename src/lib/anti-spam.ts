import { resolveMx } from "dns/promises";

/**
 * Verifica que el DOMINIO del email pueda recibir correo (tiene registros MX).
 *
 * Qué atrapa: typos de dominio (gmial.com, hotmial.com) y dominios inventados.
 * Qué NO atrapa: si la casilla exacta existe — eso solo lo prueba un correo de
 * confirmación (doble opt-in), que no se justifica acá. Ver docs/CONTENIDO.md.
 *
 * Falla "permisiva": si el DNS no responde a tiempo, se acepta el email en vez
 * de rechazar a un apoderado legítimo por un problema de red nuestro.
 */
/**
 * Forma plausible de un dominio de correo, ANTES de gastar una consulta DNS.
 *
 * Un email ya pasó el validador de zod, pero el dominio sigue siendo texto
 * arbitrario que va directo a `resolveMx()`. Sin este filtro, cada request
 * dispara una consulta DNS de lo que sea — un atacante puede apuntar a un
 * dominio con un servidor DNS lento y sostener la función serverless hasta el
 * timeout, request tras request (amplificación / gasto). Rechazar acá lo que ni
 * siquiera parece un dominio evita la consulta por completo.
 */
function dominioTieneForma(dominio: string): boolean {
  if (dominio.length > 253) return false;
  // Al menos dos etiquetas (algo.tld), sólo alfanumérico y guiones, TLD ≥2.
  return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
    dominio
  );
}

export async function dominioRecibeCorreo(email: string): Promise<boolean> {
  const dominio = email.split("@")[1]?.toLowerCase();
  if (!dominio) return false;

  // Sin forma de dominio → no vale la consulta DNS. Es un typo o un ataque.
  if (!dominioTieneForma(dominio)) return false;

  try {
    const registros = await Promise.race([
      resolveMx(dominio),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
    return Array.isArray(registros) && registros.length > 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Sin MX = dominio no recibe correo → rechazar. Timeout/otro = aceptar.
    if (msg.includes("ENOTFOUND") || msg.includes("ENODATA")) return false;
    return true;
  }
}

/** Dominios comunes para sugerir correcciones de tipeo (lado cliente). */
export const DOMINIOS_COMUNES = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
];

/**
 * Señales de bot en el payload. No dependen de "verificar el email" — los bots
 * usan direcciones reales; lo que los delata es el comportamiento.
 *
 *  - honeypot: campo oculto que un humano nunca ve ni llena.
 *  - tiempo:   un formulario enviado en < 3s es un bot, no una persona.
 */
export function pareceBot(body: {
  companyWebsite?: unknown; // honeypot
  tiempoMs?: unknown;
}): boolean {
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
    return true;
  }
  const t = Number(body.tiempoMs);
  if (Number.isFinite(t) && t >= 0 && t < 3000) {
    return true;
  }
  return false;
}
