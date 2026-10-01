/**
 * MODO REVISIÓN — toggle del tema CLÁSICO (verde jade).
 *
 * El sitio se sirve estático con el tema del uniforme (navy/carmesí) como
 * default. Poniendo el atributo `data-theme="clasico"` en <html> deja de
 * aplicar el bloque del uniforme en src/app/globals.css y el sitio entero
 * vuelve al verde jade, sin recompilar ni pedir nada al servidor. Es una vista
 * interna: se enciende con el botón del footer para comparar con "lo de antes".
 *
 * Persistencia por COOKIE (no localStorage: lo prohíbe CLAUDE.md, y además la
 * cookie la lee un script inline en el <head> del layout para aplicar el tema
 * ANTES del primer paint y que no parpadee al navegar entre páginas).
 *
 * Todo corre en el cliente. El servidor NUNCA lee la cookie: si lo hiciera, las
 * páginas se volverían dinámicas y se romperían en Vercel (regla estático-first).
 */

export const TEMA_COOKIE = "gc-tema";
export const TEMA_CLASICO = "clasico";
/** Evento que emitimos al cambiar, para que el botón y el aviso se sincronicen. */
export const TEMA_EVENT = "gc-tema-change";

/** ¿Está activo el MODO REVISIÓN ahora mismo? (lee el DOM, la verdad de turno) */
export function temaActivo(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.theme === TEMA_CLASICO;
}

/** Aplica (o quita) el tema clásico: <html>, cookie 30 días y avisa a la UI. */
export function aplicarTema(activo: boolean): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (activo) html.dataset.theme = TEMA_CLASICO;
  else delete html.dataset.theme;

  document.cookie = activo
    ? `${TEMA_COOKIE}=${TEMA_CLASICO}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${TEMA_COOKIE}=; path=/; max-age=0; samesite=lax`;

  window.dispatchEvent(new CustomEvent(TEMA_EVENT, { detail: { activo } }));
}

/** Enciende/apaga el MODO REVISIÓN. */
export function toggleTema(): void {
  aplicarTema(!temaActivo());
}
