/**
 * Reglas de los archivos adjuntos del formulario de contacto.
 *
 * Lo usan el formulario (para avisar antes de enviar) y /api/contacto (que es el
 * que de verdad decide). Sin dependencias de Node: tiene que poder ir al bundle
 * del cliente.
 *
 * Qué categoría acepta adjuntos lo dice `adjuntos: true` en
 * `contacto.categorias` (src/content/config.ts), no este archivo.
 */

export const MAX_ADJUNTOS = 3;

/**
 * Tope de la suma de los adjuntos, en bytes.
 *
 * No es un número elegido: Vercel corta el request entero en 4,5 MB y eso
 * incluye los campos del formulario y el overhead del multipart. 4 MB deja
 * margen. Por eso el formulario comprime las fotos antes de enviarlas.
 */
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** Lo que se acepta, con la extensión que se le pone al archivo en el correo. */
export const TIPOS_ADJUNTO = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

export type TipoAdjunto = keyof typeof TIPOS_ADJUNTO;

/** Para el `accept` del <input type="file">. */
export const ACCEPT_ADJUNTOS = [
  ...Object.keys(TIPOS_ADJUNTO),
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".docx",
].join(",");

const empiezaCon = (b: Uint8Array, firma: number[], desde = 0) =>
  firma.every((v, i) => b[desde + i] === v);

/**
 * Tipo real del archivo según sus primeros bytes.
 *
 * El `type` que manda el navegador y la extensión los elige quien sube el
 * archivo: un .exe renombrado a .pdf pasa cualquier chequeo que mire eso. Los
 * bytes no mienten de la misma forma. Devuelve null si no es nada aceptado.
 *
 * El .docx es un zip: la firma `PK` sola no lo distingue de cualquier otro zip,
 * así que se exige además la extensión. Gmail igual escanea lo que le llega.
 */
export function detectarTipo(bytes: Uint8Array, nombre: string): TipoAdjunto | null {
  if (empiezaCon(bytes, [0x25, 0x50, 0x44, 0x46])) return "application/pdf"; // %PDF
  if (empiezaCon(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (empiezaCon(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (empiezaCon(bytes, [0x52, 0x49, 0x46, 0x46]) && empiezaCon(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  if (empiezaCon(bytes, [0x50, 0x4b, 0x03, 0x04]) && /\.docx$/i.test(nombre)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

/**
 * Nombre seguro para el adjunto del correo: sin ruta, sin caracteres de
 * control ni de sistema de archivos, corto y con la extensión del tipo REAL.
 * El nombre lo escribe un desconocido y termina en una cabecera MIME.
 */
export function nombreSeguro(nombre: string, tipo: TipoAdjunto, n: number): string {
  const base = (nombre.split(/[\\/]/).pop() || "")
    .replace(/\.[^.]*$/, "")
    .replace(/[\u0000-\u001F\u007F"<>:|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || `adjunto-${n}`}.${TIPOS_ADJUNTO[tipo]}`;
}

export const formatoMB = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB`;
