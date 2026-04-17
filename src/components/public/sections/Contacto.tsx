import ContactForm from "@/components/public/shared/ContactForm";

interface Sede {
  nombre: string;
  direccion: string;
  telefono: string;
  niveles: string;
}

interface ContactoProps {
  sedes: Sede[];
  email: string;
}

export default function Contacto({ sedes, email }: ContactoProps) {
  return (
    <section id="contacto" className="pt-12 pb-8">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <span className="badge-gold mb-4 inline-block">Estamos cerca</span>
          <h2 className="section-heading">Contacto</h2>
          <p className="section-subheading mx-auto mt-4">
            ¿Tienes preguntas? Escríbenos y te responderemos a la brevedad
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Info de sedes */}
          <div className="lg:col-span-2 space-y-6">
            {sedes.map((sede) => (
              <div key={sede.nombre} className="p-6 bg-gc-cream rounded-2xl">
                <h3 className="text-lg font-display font-bold text-gc-green-800 mb-3">
                  {sede.nombre}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gc-gold-dark mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-gc-green-800/70 font-body text-sm">{sede.direccion}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gc-gold-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <a
                      href={`tel:${sede.telefono.replace(/[^\d+]/g, "")}`}
                      className="text-gc-green-800/70 font-body text-sm hover:text-gc-gold-dark transition-colors"
                    >
                      {sede.telefono}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gc-gold-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                    </svg>
                    <span className="text-gc-green-800/70 font-body text-sm">{sede.niveles}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Email general */}
            {email && (
              <div className="p-6 bg-gc-cream rounded-2xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gc-gold-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <a
                    href={`mailto:${email}`}
                    className="text-gc-green-800/70 font-body text-sm hover:text-gc-gold-dark transition-colors"
                  >
                    {email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 lg:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-display font-bold text-gc-green-800 mb-6">
                Envíanos un mensaje
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
