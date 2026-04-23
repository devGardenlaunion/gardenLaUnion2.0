import type { Metadata } from "next";
import Image from "next/image";
import { getConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/public/sections/Navbar";
import Footer from "@/components/public/sections/Footer";

export const metadata: Metadata = {
  title: "Convivencia y Valores | Garden College",
  description:
    "Conoce el enfoque de convivencia de Garden College. Cero denuncias de bullying en 2025, pilares de valores y una comunidad comprometida con el respeto.",
  openGraph: {
    title: "Convivencia y Valores | Garden College",
    description:
      "Cómo construimos un espacio donde cada estudiante se siente seguro, respetado y acompañado.",
  },
};

const EVENTOS_CONVIVENCIA = [
  "bingo-familiar",
  "dia-del-profesor",
  "fiestas-patrias",
];

const DOCS_CONVIVENCIA = [
  {
    titulo: "Reglamento de Convivencia Escolar",
    descripcion: "Normas de convivencia, sanciones y procedimientos",
  },
  {
    titulo: "Plan de Gestión de Convivencia Escolar",
    descripcion: "Acciones preventivas y formativas para la buena convivencia",
  },
  {
    titulo: "Protocolo de Actuación frente a Violencia",
    descripcion: "Prevención y resolución de situaciones de violencia escolar",
  },
];

// ─── Componentes de anotación ────────────────────────────────────────────────

function NotaAmarilla({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="font-body font-semibold text-amber-800 text-sm">
            {titulo}
          </span>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-body font-semibold rounded-full border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Pendiente de entrega
        </span>
      </div>
      <div className="text-amber-800/80 font-body text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

function NotaVerde({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
      <svg
        className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <div className="text-emerald-800 font-body text-sm leading-relaxed">
        <span className="font-semibold">Automático — </span>
        {children}
      </div>
    </div>
  );
}

function EjemploBloque({
  noLabel,
  noText,
  siLabel,
  siText,
}: {
  noLabel: string;
  noText: string;
  siLabel: string;
  siText: string;
}) {
  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-3">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs font-body font-semibold text-red-700 uppercase tracking-wide mb-1.5">
          {noLabel}
        </p>
        <p className="text-xs text-red-700/70 font-body italic leading-relaxed">
          &ldquo;{noText}&rdquo;
        </p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs font-body font-semibold text-green-700 uppercase tracking-wide mb-1.5">
          {siLabel}
        </p>
        <p className="text-xs text-green-700/80 font-body italic leading-relaxed">
          &ldquo;{siText}&rdquo;
        </p>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function ConvivenciaPage() {
  const [config, eventosRelacionados] = await Promise.all([
    getConfig(),
    prisma.edicion.findMany({
      where: {
        estado: "PUBLICADA",
        evento: { slug: { in: EVENTOS_CONVIVENCIA } },
      },
      orderBy: { fecha: "desc" },
      select: {
        id: true,
        titulo: true,
        slug: true,
        extracto: true,
        fecha: true,
        evento: { select: { nombre: true, slug: true } },
      },
    }),
  ]);

  const nombre = config["institucional.nombre"] || "Garden College";

  const logros: { cifra: string; descripcion: string }[] =
    config["convivencia.logros"] || [];
  const pilares: { titulo: string; descripcion: string }[] =
    config["convivencia.pilares"] || [];
  const testimonios: {
    texto: string;
    nombre: string;
    rol: string;
    iniciales: string;
  }[] = config["convivencia.testimonios"] || [];
  const campana: { titulo: string; descripcion: string; ano: string } | null =
    config["convivencia.campana"] || null;
  const enfoqueCompleto: string =
    config["convivencia.enfoque_completo"] ||
    config["convivencia.descripcion"] ||
    "";

  return (
    <>
      <Navbar
        nombre={nombre}
        telefonoBasica={config["contacto.sede_basica.telefono"]}
        telefonoMedia={config["contacto.sede_media.telefono"]}
        variant="solid"
      />

      <main className="pt-16 lg:pt-20">

        {/* ── HERO ── */}
        <section className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden">
          {/* Imagen de fondo */}
          <Image
            src="https://picsum.photos/seed/garden-convivencia/1920/1080"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gc-green-900/90 via-gc-green-800/85 to-gc-green-800/80" />

          {/* Patrón decorativo */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Acento dorado */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gc-gold/5 to-transparent" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gc-gold/5 blur-3xl -translate-x-1/2 translate-y-1/2" />

          <div className="relative container-gc py-20 sm:py-24 lg:py-32">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gc-gold/20 text-gc-gold-light text-xs font-semibold rounded-full border border-gc-gold/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gc-gold animate-pulse" />
                Nuestro diferenciador
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
                Convivencia y valores en Garden College
              </h1>
              <div className="w-16 h-1 bg-gc-green rounded-full mb-6" />
              <p className="text-lg sm:text-xl text-gc-green-100/75 font-body leading-relaxed mb-10">
                Cómo construimos un espacio donde cada estudiante se siente
                seguro, respetado y acompañado
              </p>

              {/* Nota sobre el hero (dentro del hero, no banner global) */}
              <div className="bg-amber-400/20 border border-amber-400/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-amber-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-amber-300 font-body font-semibold text-sm">Nota: texto pendiente de validación</span>
                </div>
                <p className="text-amber-200/80 font-body text-sm leading-relaxed">
                  El título y subtítulo son una propuesta. El encargado de convivencia puede validarlos o proponer un texto diferente. Avisar a YoaOses con el cambio.
                </p>
              </div>
            </div>

            {/* Cifras */}
            {logros.length > 0 && (
              <div className="flex flex-wrap gap-10 sm:gap-16 border-t border-gc-green-100/10 pt-10 mt-10">
                {logros.map((logro) => (
                  <div key={logro.descripcion}>
                    <div className="text-4xl lg:text-5xl font-display font-bold text-gc-gold leading-none mb-1">
                      {logro.cifra}
                    </div>
                    <div className="text-gc-green-100/50 font-body text-xs uppercase tracking-widest max-w-[180px]">
                      {logro.descripcion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Onda inferior */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
              <path d="M0 80V40C240 13 480 0 720 13C960 27 1200 53 1440 40V80H0Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── NUESTRO ENFOQUE ── */}
        <section className="py-14 lg:py-20 bg-white">
          <div className="container-gc">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Nuestro enfoque
              </h2>

              {/* Preview del texto actual (placeholder) */}
              <div className="mt-8 space-y-5">
                {enfoqueCompleto
                  .split("\n\n")
                  .filter(Boolean)
                  .map((parrafo, i) => (
                    <p
                      key={i}
                      className="text-gc-green-800/60 font-body leading-relaxed text-lg italic"
                    >
                      {parrafo}
                    </p>
                  ))}
              </div>
              <p className="text-xs text-gc-green-800/25 font-body mt-2 italic">
                ↑ Este es el texto placeholder. Será reemplazado por el texto real.
              </p>

              <NotaAmarilla titulo="Qué necesitamos: Un párrafo sobre el enfoque de convivencia">
                <p>
                  <strong>Formato:</strong> 1 párrafo, 3-5 oraciones, máximo 80 palabras.
                </p>
                <p>
                  <strong>Tono:</strong> Cálido, directo. Escrito como si le explicaras a un apoderado nuevo por qué eligió bien este colegio.
                </p>
                <p>
                  <strong>Mencionar:</strong> Que el fundamento viene de los valores cristianos, pero sin sonar exclusivo ni excluyente.
                </p>
                <p>
                  <strong>No hacer:</strong> Copiar del PEI. El PEI es un documento formal. La web es para personas. Reescribir con tono humano.
                </p>
                <EjemploBloque
                  noLabel="❌ Lo que NO queremos"
                  noText="El establecimiento educacional promueve la sana convivencia escolar conforme al Reglamento Interno y la normativa vigente del MINEDUC..."
                  siLabel="✅ Lo que SÍ queremos"
                  siText="En Garden College creemos que un niño que se siente seguro, aprende mejor. Nuestro enfoque de convivencia nace de un principio simple: tratar al otro como queremos ser tratados. Eso se enseña, se practica y se vive cada día."
                />
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── CIFRAS Y LOGROS (dentro del Hero, pero anotamos acá) ── */}
        <section className="py-14 lg:py-20 section-alt">
          <div className="container-gc">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Cifras y logros
              </h2>

              {/* Preview cifras actuales */}
              <div className="mt-8 flex flex-wrap gap-8">
                {logros.length > 0 ? (
                  logros.map((logro) => (
                    <div key={logro.descripcion} className="text-center opacity-70">
                      <div className="text-4xl font-display font-bold text-gc-green-800 leading-none mb-1">
                        {logro.cifra}
                      </div>
                      <div className="text-gc-green-800/60 font-body text-xs uppercase tracking-widest max-w-[160px]">
                        {logro.descripcion}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gc-green-800/30 font-body italic text-sm">
                    (No hay cifras cargadas aún)
                  </p>
                )}
              </div>
              <p className="text-xs text-gc-green-800/25 font-body mt-2 italic">
                ↑ Preview de las cifras actuales. Se muestran en el Hero de la página.
              </p>

              <NotaAmarilla titulo="Qué necesitamos: 2 a 4 datos verificables">
                <p>Confirmar con <strong>Inspectoría</strong> y <strong>CGPA</strong>. Solo datos reales — si no hay dato exacto, no inventar.</p>
                <p className="font-semibold mt-3 mb-1">Datos que buscamos:</p>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-100">
                        <th className="text-left px-3 py-2 font-semibold text-amber-900 rounded-tl-lg">Dato</th>
                        <th className="text-left px-3 py-2 font-semibold text-amber-900">Ejemplo</th>
                        <th className="text-left px-3 py-2 font-semibold text-amber-900 rounded-tr-lg">¿Confirmado?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      <tr>
                        <td className="px-3 py-2 text-amber-800">Resultado campaña anti-bullying</td>
                        <td className="px-3 py-2 text-amber-700 italic">"0 denuncias formales en 2025"</td>
                        <td className="px-3 py-2"><span className="text-green-700 font-semibold">✅ De la noticia</span></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-amber-800">Años sin incidentes graves</td>
                        <td className="px-3 py-2 text-amber-700 italic">"X años consecutivos"</td>
                        <td className="px-3 py-2"><span className="text-red-600 font-semibold">⏳ Confirmar con Inspectoría</span></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-amber-800">Participación en talleres CGPA</td>
                        <td className="px-3 py-2 text-amber-700 italic">"X% de asistencia"</td>
                        <td className="px-3 py-2"><span className="text-red-600 font-semibold">⏳ Confirmar con CGPA</span></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-amber-800">Otro indicador relevante</td>
                        <td className="px-3 py-2 text-amber-700 italic">"X familias en el Bingo"</td>
                        <td className="px-3 py-2"><span className="text-amber-600 font-semibold">De las noticias</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-amber-700/70 italic">
                  Si un dato no es favorable, simplemente no incluirlo. Seleccionar lo mejor.
                </p>
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── NUESTROS PILARES ── */}
        <section className="py-14 lg:py-20 bg-white">
          <div className="container-gc">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Nuestros pilares
              </h2>

              {/* Preview pilares actuales */}
              {pilares.length > 0 && (
                <div className="mt-8 grid sm:grid-cols-2 gap-5 opacity-75">
                  {pilares.map((pilar) => (
                    <div
                      key={pilar.titulo}
                      className="bg-white rounded-xl p-6 border-l-4 border-gc-green shadow-sm"
                    >
                      <h3 className="font-display font-bold text-gc-green-800 mb-3 text-lg">
                        {pilar.titulo}
                      </h3>
                      <p className="text-gc-green-800/65 font-body text-sm leading-relaxed">
                        {pilar.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gc-green-800/25 font-body mt-2 italic">
                ↑ Preview de los 4 pilares actuales. Pendientes de validación.
              </p>

              <NotaAmarilla titulo="Qué necesitamos: Validar o proponer los pilares de convivencia">
                <p>Los 4 pilares de arriba son una <strong>propuesta basada en el PEI</strong>. El encargado de convivencia debe:</p>
                <ul className="list-disc list-inside space-y-1 mt-1 text-amber-800/70">
                  <li>Validar estos 4 textos (o ajustar lo que no corresponde)</li>
                  <li>Si el colegio usa otros nombres internamente para sus pilares, respetarlos</li>
                  <li>Cada pilar: título corto + 2-3 oraciones</li>
                  <li>Evitar jerga técnica del MINEDUC. Escribir para apoderados, no para fiscalizadores</li>
                </ul>
                <p className="mt-2 text-amber-700/70 italic">
                  Se pueden usar los textos propuestos como base y ajustarlos con pequeños cambios.
                </p>
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── UN COLEGIO SIN BULLYING — SECCIÓN ESTRELLA ── */}
        <section className="py-14 lg:py-20 section-alt">
          <div className="container-gc">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Un Colegio Sin Bullying
              </h2>

              {/* Preview estructura */}
              <div className="mt-8 bg-gc-green-50 rounded-2xl border border-gc-green-100 p-8 opacity-75">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gc-green/10 flex items-center justify-center text-gc-green">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gc-green-800 text-xl mb-2">
                      {campana?.titulo || "Campaña institucional — Cero denuncias"}
                    </h3>
                    <p className="text-gc-green-800/60 font-body text-sm leading-relaxed">
                      {campana?.descripcion || "[El texto completo de la campaña irá aquí]"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gc-green-800/25 font-body mt-2 italic">
                ↑ Estructura de la tarjeta. El contenido real irá donde están los textos grises.
              </p>

              <NotaAmarilla titulo="⭐ CONTENIDO PRIORITARIO: Historia de la campaña anti-bullying">
                <p className="font-semibold text-amber-900">
                  Este es el contenido más importante de toda la sección. Garden College tiene un diferenciador real: la campaña &ldquo;Un Colegio Sin Bullying&rdquo; logró cero denuncias. Hay que contarlo bien.
                </p>
                <p className="mt-2">Necesitamos que el equipo de convivencia (o quien lideró la campaña) redacte:</p>
                <ul className="list-disc list-inside space-y-1 mt-1 text-amber-800/70">
                  <li><strong>Cómo nació la campaña</strong> — quién la propuso, cuándo</li>
                  <li><strong>Quién la lideró</strong> — ¿fue el CGPA? ¿la dirección? ¿los estudiantes?</li>
                  <li><strong>Qué actividades se hicieron</strong> — talleres, jornadas, compromisos firmados</li>
                  <li><strong>Cuántas personas participaron</strong> — número de familias, cursos involucrados</li>
                  <li><strong>Resultados concretos</strong> — cero denuncias en 2025, qué cambió</li>
                </ul>
                <p className="mt-2 font-semibold text-amber-800">
                  Formato: texto narrativo de 150-250 palabras. No tiene que ser perfecto — se puede pulir.
                </p>
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── LA COMUNIDAD OPINA ── */}
        <section className="py-14 lg:py-20 bg-white">
          <div className="container-gc">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                La comunidad opina
              </h2>

              {/* Preview testimonios (como placeholder visual) */}
              <div className="mt-8 space-y-5 opacity-75">
                <div className="bg-gc-cream rounded-xl p-7 shadow-sm">
                  <div className="text-6xl leading-none text-gc-gold/25 font-serif mb-2 select-none" aria-hidden>
                    &ldquo;
                  </div>
                  <p className="text-gc-green-800/80 font-body italic text-lg leading-relaxed -mt-3 mb-6">
                    Lo que más valoro de Garden College es que mi hija llega contenta. Sé que está en un lugar donde la cuidan y la respetan.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gc-green-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-gc-green-100 font-display font-bold text-xs">MG</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-gc-green-800 text-sm leading-tight">
                        María González
                      </p>
                      <p className="text-gc-green-800/40 font-body text-xs">
                        Apoderada de 3° básico
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gc-green-800/25 font-body mt-2 italic">
                ↑ Ejemplo de cómo se ve un testimonio en la web.
              </p>

              <NotaAmarilla titulo="Qué necesitamos: 1-2 testimonios reales de la comunidad">
                <p>
                  Un <strong>apoderado</strong> + un <strong>docente o directivo</strong>. Si no hay los dos, con uno es suficiente para empezar.
                </p>
                <p className="mt-1 font-semibold">Por cada testimonio necesitamos:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800/70">
                  <li>Cita textual (no parafraseada)</li>
                  <li>Nombre completo</li>
                  <li>Rol (ej: &ldquo;Apoderada de 3° básico&rdquo;, &ldquo;Profesora de Ciencias&rdquo;)</li>
                  <li><strong>Confirmación escrita de que autorizan su publicación</strong></li>
                </ul>
                <p className="mt-2 text-amber-700 italic">
                  Si no hay testimonios disponibles todavía, el espacio queda preparado en la web y se agrega después. No hay problema.
                </p>
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── CONVIVENCIA EN ACCIÓN (FOTOS) ── */}
        <section className="py-14 lg:py-20 section-alt">
          <div className="container-gc">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Convivencia en acción
              </h2>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-gc-green-50 border-2 border-dashed border-gc-green-100 flex flex-col items-center justify-center gap-2 text-center p-4"
                  >
                    <svg
                      className="w-8 h-8 text-gc-green-800/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                    <p className="text-gc-green-800/30 font-body text-xs">
                      Foto {i + 1}
                    </p>
                  </div>
                ))}
              </div>

              <NotaAmarilla titulo="Qué necesitamos: 4-6 fotos de actividades de convivencia">
                <p>Fotos de:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800/70">
                  <li>Talleres del CGPA</li>
                  <li>Jornadas de integración entre cursos</li>
                  <li>Campañas de convivencia (murales, actividades)</li>
                  <li>Actos de servicio comunitario</li>
                  <li>Actividades de la campaña &ldquo;Un Colegio Sin Bullying&rdquo;</li>
                </ul>
                <p className="mt-2">
                  <strong>Formato:</strong> JPG o PNG. Mínimo 1200px de ancho. Fotos actuales (2024-2026), no de archivos viejos.
                </p>
                <p className="mt-1 text-amber-700/70 italic">
                  Las fotos se cargan al panel admin y aparecen aquí automáticamente.
                </p>
              </NotaAmarilla>
            </div>
          </div>
        </section>

        {/* ── EVENTOS RELACIONADOS ── */}
        {eventosRelacionados.length > 0 && (
          <section className="py-14 lg:py-20 bg-white">
            <div className="container-gc">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                  Convivencia en eventos
                </h2>
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  {eventosRelacionados.map((edicion) => {
                    const fecha = new Intl.DateTimeFormat("es-CL", {
                      year: "numeric",
                      month: "long",
                    }).format(edicion.fecha);
                    return (
                      <a
                        key={edicion.id}
                        href={`/eventos/${edicion.evento.slug}`}
                        className="group bg-white rounded-xl p-5 border border-gc-gray-200 hover:border-gc-green/30 hover:shadow-md transition-all flex items-start gap-4"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gc-green-50 text-gc-green flex items-center justify-center group-hover:bg-gc-green group-hover:text-white transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gc-green-800/40 font-body mb-0.5">
                            {edicion.evento.nombre} · {fecha}
                          </p>
                          <h3 className="font-display font-bold text-gc-green-800 text-sm leading-snug mb-1.5 group-hover:text-gc-green transition-colors">
                            {edicion.titulo}
                          </h3>
                          <p className="text-gc-green-800/55 font-body text-xs leading-relaxed line-clamp-2">
                            {edicion.extracto}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-gc-green-800/20 group-hover:text-gc-green flex-shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    );
                  })}
                </div>

                <NotaVerde>
                  Estos links se generan solos desde los eventos del colegio que ya están cargados en el sistema. No requiere acción del encargado de contenido.
                </NotaVerde>
              </div>
            </div>
          </section>
        )}

        {/* ── DOCUMENTACIÓN OFICIAL ── */}
        <section className="py-14 lg:py-20 section-alt">
          <div className="container-gc">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gc-green-800 pb-3 border-b-2 border-gc-green">
                Documentación oficial
              </h2>
              <p className="text-gc-green-800/60 font-body mt-6 mb-8">
                Accede a los documentos institucionales relacionados con la
                convivencia escolar en nuestro Centro de Documentación.
              </p>
              <div className="space-y-3">
                {DOCS_CONVIVENCIA.map((doc) => (
                  <a
                    key={doc.titulo}
                    href="/documentos"
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gc-gray-200 hover:border-gc-green/30 hover:bg-gc-green-50/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 15.5h7v1h-7v-1zm0-3h7v1h-7v-1zm0-3H11v1H8.5v-1z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-gc-green-800 text-sm group-hover:text-gc-green transition-colors">
                        {doc.titulo}
                      </p>
                      <p className="text-xs text-gc-green-800/40 font-body mt-0.5">
                        {doc.descripcion}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gc-green-800/20 group-hover:text-gc-green flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>

              <NotaVerde>
                Esta sección conecta automáticamente con el Centro de Documentación que ya existe en la web. No requiere acción del encargado de contenido.
              </NotaVerde>
            </div>
          </div>
        </section>

        {/* ── CHECKLIST FINAL ── */}
        <section className="py-14 lg:py-20 bg-white">
          <div className="container-gc">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gc-green-50 border border-gc-green-200 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gc-green flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h2 className="font-display font-bold text-xl lg:text-2xl text-gc-green-900">
                    Resumen: qué necesitamos de ti
                  </h2>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      item: "Validar o proponer texto introductorio (título + subtítulo del Hero)",
                      estado: "pendiente",
                      nota: "Validar o proponer alternativa",
                    },
                    {
                      item: "Párrafo sobre el enfoque de convivencia",
                      estado: "pendiente",
                      nota: "Máx. 80 palabras, tono cálido",
                    },
                    {
                      item: "Cifras verificables (Inspectoría + CGPA)",
                      estado: "pendiente",
                      nota: "Solo datos reales. Ver tabla arriba.",
                    },
                    {
                      item: "Validar los 4 pilares de convivencia",
                      estado: "pendiente",
                      nota: "Ajustar o aprobar los textos propuestos",
                    },
                    {
                      item: "Historia completa de la campaña Un Colegio Sin Bullying",
                      estado: "pendiente",
                      nota: "150-250 palabras — PRIORITARIO",
                    },
                    {
                      item: "1-2 testimonios reales (con autorización)",
                      estado: "pendiente",
                      nota: "Apoderado + docente o directivo",
                    },
                    {
                      item: "4-6 fotos de actividades de convivencia",
                      estado: "pendiente",
                      nota: "JPG/PNG, mín. 1200px, 2024-2026",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gc-green-100"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-amber-300 bg-amber-50 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-gc-green-900 text-sm">
                          {row.item}
                        </p>
                        <p className="text-gc-green-800/50 font-body text-xs mt-0.5">
                          {row.nota}
                        </p>
                      </div>
                      <span className="flex-shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-body font-semibold rounded-full border border-amber-200">
                        Pendiente
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gc-green-200 grid sm:grid-cols-2 gap-4 text-sm font-body">
                  <div>
                    <p className="font-semibold text-gc-green-900 mb-1">Plazo sugerido</p>
                    <p className="text-gc-green-800/60">
                      2 semanas desde la recepción de esta guía. Se puede ir entregando por bloques — no es necesario esperar a tener todo listo.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gc-green-900 mb-1">Formato de entrega</p>
                    <p className="text-gc-green-800/60">
                      Texto por correo o Google Doc. Fotos en la mejor resolución disponible. Datos con indicación de la fuente.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gc-green-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gc-green-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-display font-bold text-xs">Y</span>
                  </div>
                  <p className="text-gc-green-800/70 font-body text-sm">
                    <strong className="text-gc-green-900">Dudas →</strong> YoaOses — Responsable técnico del proyecto de digitalización
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer
        nombre={nombre}
        corporacion={config["institucional.corporacion"] || ""}
        redes={{
          facebook: config["redes.facebook"],
          instagram: config["redes.instagram"],
          youtube: config["redes.youtube"],
        }}
      />
    </>
  );
}
