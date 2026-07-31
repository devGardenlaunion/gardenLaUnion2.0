/**
 * MODO REVISIÓN — toggle del tema del uniforme nuevo (navy/carmesí).
 *
 * El sitio se sirve estático en verde jade (tema actual). Poniendo el atributo
 * `data-theme="uniforme"` en <html> se reescriben las variables CSS de la paleta
 * (ver src/app/globals.css) y el sitio entero flipea al tema del uniforme, sin
 * recompilar ni pedir nada al servidor. Es una vista previa interna: el editor
 * la enciende con el botón del footer para mostrar "lo que se viene".
 *
 * Persistencia por COOKIE (no localStorage: lo prohíbe CLAUDE.md, y además la
 * cookie la lee un script inline en el <head> del layout para aplicar el tema
 * ANTES del primer paint y que no parpadee al navegar entre páginas).
 *
 * Todo corre en el cliente. El servidor NUNCA lee la cookie: si lo hiciera, las
 * páginas se volverían dinámicas y se romperían en Vercel (regla estático-first).
 */

export const TEMA_COOKIE = "gc-tema";
export const TEMA_UNIFORME = "uniforme";
/** Evento que emitimos al cambiar, para que el botón y el aviso se sincronicen. */
export const TEMA_EVENT = "gc-tema-change";

/** ¿Está activo el MODO REVISIÓN ahora mismo? (lee el DOM, la verdad de turno) */
export function temaActivo(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.theme === TEMA_UNIFORME;
}

/** Aplica (o quita) el tema uniforme: <html>, cookie 30 días y avisa a la UI. */
export function aplicarTema(activo: boolean): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (activo) html.dataset.theme = TEMA_UNIFORME;
  else delete html.dataset.theme;

  document.cookie = activo
    ? `${TEMA_COOKIE}=${TEMA_UNIFORME}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${TEMA_COOKIE}=; path=/; max-age=0; samesite=lax`;

  window.dispatchEvent(new CustomEvent(TEMA_EVENT, { detail: { activo } }));
}

/** Enciende/apaga el MODO REVISIÓN. */
export function toggleTema(): void {
  aplicarTema(!temaActivo());
}
