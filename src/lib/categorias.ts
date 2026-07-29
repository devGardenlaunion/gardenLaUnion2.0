import { contenido } from "@/content/config";

/**
 * Opciones válidas del formulario de contacto: categorías y sedes.
 *
 * Salen de src/content/config.ts — no se escriben acá (regla SaaS-ready: nada
 * del colegio hardcodeado en lógica). Este módulo sólo las expone tipadas y da
 * los validadores que usa el server.
 *
 * El `id` es la clave estable: viaja en el asunto del correo y en la cabecera
 * `X-GC-Categoria`. El `label` es lo que ve el apoderado y se puede cambiar sin
 * romper nada.
 */

export interface CategoriaContacto {
  id: string;
  label: string;
}

// El contenido es `as const` (readonly): se copia para exponerlo mutable sin
// castear a ciegas — así un cambio de forma en config.ts lo caza el compilador.
export const CATEGORIAS: CategoriaContacto[] = [...contenido["contacto.categorias"]];

const IDS = new Set(CATEGORIAS.map((c) => c.id));

/** True si el id vino de la lista real. El server NUNCA confía en el cliente. */
export function esCategoriaValida(id: unknown): id is string {
  return typeof id === "string" && IDS.has(id);
}

/** Texto legible de una categoría. Cae al propio id si no la encuentra. */
export function labelCategoria(id: string): string {
  return CATEGORIAS.find((c) => c.id === id)?.label ?? id;
}

/**
 * Ids de sede, deducidos de las claves `contacto.sede_<id>.nombre` del
 * contenido. No se listan a mano: agregar una sede al config la habilita sola.
 */
export const SEDES = Object.keys(contenido)
  .map((k) => /^contacto\.sede_([a-z0-9_]+)\.nombre$/.exec(k)?.[1])
  .filter((id): id is string => Boolean(id));

/**
 * True si el id de sede existe.
 *
 * Importa más de lo que parece: la sede termina dentro de la cabecera
 * `X-GC-Sede` del correo. Un campo libre que va a parar a una cabecera es
 * exactamente la forma de una inyección de cabeceras — se valida contra lista
 * blanca y se acabó la discusión.
 */
export function esSedeValida(id: unknown): id is string {
  return typeof id === "string" && SEDES.includes(id);
}
