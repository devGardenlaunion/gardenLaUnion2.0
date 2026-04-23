import Image from "next/image";

interface AdmisionProps {
  info: string;
  linkSae: string;
  imagen?: string;
}

export default function Admision({ info, linkSae, imagen }: AdmisionProps) {
  return (
    <section id="admision" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="badge-gold mb-4 inline-block">Únete a nuestra comunidad</span>
            <h2 className="section-heading">Proceso de Admisión</h2>
          </div>

          <div className="card p-8 lg:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">

              {/* Imagen — izquierda en desktop, arriba en mobile */}
              <div className="order-1 md:order-none">
                {/* TODO: reemplazar con foto real de admisión */}
                {imagen ? (
                  <div className="relative h-[380px] w-full rounded-xl overflow-hidden">
                    <Image
                      src={imagen}
                      alt="Estudiantes Garden College"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gc-green-900/40 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-[380px] w-full rounded-xl overflow-hidden bg-gc-green flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-gc-green-900/40 to-transparent" />
                    <Image
                      src="/media/Logo/cropped-cropped-logo.png"
                      alt="Garden College"
                      width={120}
                      height={120}
                      className="relative z-10 opacity-40"
                    />
                  </div>
                )}
              </div>

              {/* Texto + CTA — derecha en desktop, abajo en mobile */}
              <div className="order-2 md:order-none flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-gc-green-800 mb-4">
                    Sistema de Admisión Escolar (SAE)
                  </h3>
                  <p className="text-gc-green-800/70 font-body leading-relaxed mb-6">
                    {info}
                  </p>
                  <div className="space-y-3">
                    {[
                      "Postulación a través de la plataforma oficial del Mineduc",
                      "Proceso transparente y objetivo",
                      "Prioridades según normativa vigente",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-gc-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-gc-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <span className="text-gc-green-800/70 font-body text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-gc-green-800/60 font-body text-sm mb-4 text-center">
                    La postulación se realiza directamente en la plataforma oficial del Ministerio de Educación de Chile.
                  </p>
                  <a
                    href={linkSae}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Postular en SAE Mineduc
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                  <p className="text-xs text-gc-green-800/30 font-body mt-3">
                    Se abre en el sitio oficial del Mineduc
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
