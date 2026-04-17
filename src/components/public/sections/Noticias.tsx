import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function Noticias() {
  const noticias = await prisma.noticia.findMany({
    where: { estado: "PUBLICADA" },
    orderBy: { fechaPublicacion: "desc" },
    take: 6,
    select: {
      id: true,
      titulo: true,
      slug: true,
      extracto: true,
      imagenPortada: true,
      fechaPublicacion: true,
      categorias: {
        select: { nombre: true, slug: true },
      },
    },
  });

  if (noticias.length === 0) return null;

  return (
    <section id="noticias" className="pt-12 pb-8 section-alt">
      <div className="container-gc">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <span className="badge-gold mb-4 inline-block">Vida escolar</span>
          <h2 className="section-heading">Noticias y Actividades</h2>
          <p className="section-subheading mx-auto mt-4">
            Lo que está pasando en nuestra comunidad educativa
          </p>
        </div>

        {/* Grid de noticias */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {noticias.map((noticia) => (
            <article key={noticia.id} className="card group">
              {/* Imagen placeholder o real */}
              <div className="aspect-[16/10] bg-gradient-to-br from-gc-cream to-gc-gray-100 relative overflow-hidden">
                {noticia.imagenPortada ? (
                  <img
                    src={noticia.imagenPortada}
                    alt={noticia.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gc-gold/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gc-gold/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Categorías */}
                {noticia.categorias.length > 0 && (
                  <div className="absolute top-3 left-3 flex gap-2">
                    {noticia.categorias.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gc-green-800 text-xs font-body font-semibold rounded-md"
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-5 lg:p-6">
                {noticia.fechaPublicacion && (
                  <time className="text-sm text-gc-green-800/40 font-body">
                    {format(
                      new Date(noticia.fechaPublicacion),
                      "d 'de' MMMM, yyyy",
                      { locale: es }
                    )}
                  </time>
                )}

                <h3 className="text-lg font-display font-bold text-gc-green-800 mt-2 mb-3 line-clamp-2 group-hover:text-gc-gold-dark transition-colors">
                  {noticia.titulo}
                </h3>

                <p className="text-gc-green-800/60 font-body text-sm leading-relaxed line-clamp-3">
                  {noticia.extracto}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
