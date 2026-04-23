import { recursos as todosLosRecursos, type RecursoItem } from "@/data/recursos";

function filtrarVigentes(items: RecursoItem[]): RecursoItem[] {
  const ahora = new Date();
  return items.filter(
    (r) => r.tipo !== "temporal" || !r.expiraEl || new Date(r.expiraEl) > ahora
  );
}

const IconoFlecha = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

const iconosInternos: Record<string, JSX.Element> = {
  pei: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D8578" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  "reglamento-convivencia": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D8578" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  "centro-documentacion": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D8578" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

const iconosExternos: Record<string, JSX.Element> = {
  "sae-mineduc": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B6BCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  junaeb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B6BCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  "catalogo-textos-mineduc": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B6BCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

function TarjetaInterna({ recurso }: { recurso: RecursoItem }) {
  const esDestacada = recurso.id === "centro-documentacion";
  return (
    <a
      href={recurso.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-3 p-4 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline ${
        esDestacada
          ? "bg-gc-green-50 border-gc-green/40"
          : "bg-white border-gc-green/20"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-gc-green-50 flex items-center justify-center shrink-0">
        {iconosInternos[recurso.id]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm text-gc-green-800">
          {recurso.nombre}
        </p>
        <p className="font-body text-xs text-gc-gray-400 mt-0.5">
          {recurso.descripcion}
        </p>
        <p className="font-body text-[10px] text-gc-gray-300 flex items-center gap-1 mt-1">
          <IconoFlecha />
          abre en nueva pestaña
        </p>
      </div>
    </a>
  );
}

function TarjetaExterna({ recurso }: { recurso: RecursoItem }) {
  return (
    <a
      href={recurso.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-xl border bg-white border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        {iconosExternos[recurso.id]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm" style={{ color: "#2D3E8A" }}>
          {recurso.nombre}
        </p>
        <p className="font-body text-xs text-gc-gray-400 mt-0.5">
          {recurso.descripcion}
        </p>
        <p className="font-body text-[10px] text-gc-gray-300 flex items-center gap-1 mt-1">
          <IconoFlecha />
          abre en nueva pestaña
        </p>
      </div>
    </a>
  );
}

export default function Recursos() {
  const items = filtrarVigentes(todosLosRecursos);
  const internos = items.filter((r) => r.grupo === "interno");
  const externos = items.filter((r) => r.grupo === "externo");

  if (items.length === 0) return null;

  return (
    <section id="recursos" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        <div className="text-center mb-4">
          <span className="badge-gold mb-4 inline-block">Para la comunidad</span>
          <h2 className="section-heading">Recursos y enlaces de interés</h2>
          <p className="section-subheading mx-auto mt-4">
            Accesos directos para la comunidad Garden College
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {internos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
              {internos.map((recurso) => (
                <TarjetaInterna key={recurso.id} recurso={recurso} />
              ))}
            </div>
          )}

          {internos.length > 0 && externos.length > 0 && (
            <div className="flex items-center gap-3 my-2 mb-6">
              <div className="flex-1 h-px bg-gc-gray-200" />
              <span className="text-xs text-gc-gray-400 italic font-body whitespace-nowrap">
                enlaces externos
              </span>
              <div className="flex-1 h-px bg-gc-gray-200" />
            </div>
          )}

          {externos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {externos.map((recurso) => (
                <TarjetaExterna key={recurso.id} recurso={recurso} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
