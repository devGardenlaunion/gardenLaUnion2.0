import { contenido } from "@/content/config";

/**
 * Contenido del sitio. Antes venía de la tabla ConfigSitio; ahora sale de
 * src/content/config.ts — editar ese archivo y pushear publica el cambio.
 *
 * La firma se mantiene (Record<string, any>) para que los componentes no
 * cambien: siguen leyendo config["institucional.nombre"] igual que antes.
 * Ya no es async por necesidad, pero se deja así para no tocar los callers.
 */
export async function getConfig(grupo?: string): Promise<Record<string, any>> {
  if (!grupo) return contenido as Record<string, any>;

  const prefijo = `${grupo}.`;
  return Object.fromEntries(
    Object.entries(contenido).filter(([clave]) => clave.startsWith(prefijo))
  );
}

/** Valor puntual, o null si la clave no existe. */
export async function getConfigValue(clave: string): Promise<any> {
  return (contenido as Record<string, any>)[clave] ?? null;
}
