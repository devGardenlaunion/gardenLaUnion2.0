/**
 * Baraja una copia del array (Fisher-Yates). No muta el original.
 *
 * Pensado para usarse en Server Components: al correr en el servidor, el orden
 * queda fijo en el HTML generado y rota recién en la siguiente regeneración
 * ISR — no en cada visita —, lo que evita mismatches de hidratación.
 */
export function shuffle<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
