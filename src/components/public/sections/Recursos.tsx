import { recursos as todosLosRecursos, type RecursoItem } from "@/data/recursos";

const IconoExterno = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const IconoDocumento = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconoTemporal = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const iconos = {
  externo: <IconoExterno />,
  documento: <IconoDocumento />,
  temporal: <IconoTemporal />,
};

function filtrarVigentes(items: RecursoItem[]): RecursoItem[] {
  const ahora = new Date();
  return items.filter(
    (r) => r.tipo !== "temporal" || !r.expiraEl || new Date(r.expiraEl) > ahora
  );
}

function TarjetaRecurso({ recurso }: { recurso: RecursoItem }) {
  return (
    <a
      href={recurso.url}
      target={recurso.nuevaPestana ? "_blank" : "_self"}
      rel={recurso.nuevaPestana ? "noopener noreferrer" : undefined}
      className="card group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3 no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-lg bg-gc-green-50 text-gc-green flex items-center justify-center shrink-0">
          {iconos[recurso.tipo]}
        </div>
        {recurso.tipo === "temporal" && (
          <span className="badge-gold text-xs">Acceso temporal</span>
        )}
      </div>

      <div>
        <h3 className="font-display font-semibold text-gc-green-800 group-hover:text-gc-gold-dark transition-colors leading-snug">
          {recurso.nombre}
        </h3>
        <p className="font-body text-sm text-gc-gray-500 mt-1 leading-relaxed">
          {recurso.descripcion}
        </p>
      </div>
    </a>
  );
}

export default function Recursos() {
  const items = filtrarVigentes(todosLosRecursos);

  if (items.length === 0) return null;

  return (
    <section id="recursos" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        <div className="text-center mb-10 lg:mb-16">
          <span className="badge-gold mb-4 inline-block">Para la comunidad</span>
          <h2 className="section-heading">Recursos y enlaces de interés</h2>
          <p className="section-subheading mx-auto mt-4">
            Accesos directos para la comunidad Garden College
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {items.map((recurso) => (
            <TarjetaRecurso key={recurso.id} recurso={recurso} />
          ))}
        </div>
      </div>
    </section>
  );
}
