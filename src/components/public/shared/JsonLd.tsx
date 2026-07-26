/**
 * Inyecta un bloque JSON-LD en el HTML.
 *
 * Es un Server Component: el <script> sale ya en el HTML del build, así que
 * Googlebot lo lee sin ejecutar JavaScript.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // El contenido sale de src/content/, no de input de usuario. Aun así se
      // escapa "<" para que un texto con HTML no pueda cerrar el <script>.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
