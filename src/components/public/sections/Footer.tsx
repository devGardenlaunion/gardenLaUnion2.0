import Image from "next/image";
import IconoRed from "@/components/public/shared/IconoRed";

interface FooterProps {
  nombre: string;
  corporacion: string;
  redes: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

const footerLinks = [
  { label: "Quiénes Somos", href: "#quienes-somos" },
  { label: "Sellos", href: "#sellos" },
  { label: "Historias", href: "#eventos" },
  { label: "Niveles", href: "#niveles" },
  { label: "Recursos", href: "#recursos" },
  { label: "Admisión", href: "#admision" },
  { label: "Contacto", href: "#contacto" },
];

export default function Footer({ nombre, corporacion, redes }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gc-green-900 text-white/70">
      {/* Rayas del puño del bomber (solo en MODO REVISIÓN): dos líneas carmesí
          sobre navy como remate superior del footer. */}
      <div className="rayas-uniforme" aria-hidden="true" />
      {/* Contenido principal */}
      <div className="container-gc py-12 lg:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo + info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {/* El escudo del león junto al GC (dev, 2026-11-21). */}
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/media/Logo/leon-circulo.webp"
                  alt="Escudo de Garden College"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              {/* Mismo isotipo del navbar (GC), con swap de tema verde/navy. */}
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/media/Logo/gc-identidad.webp"
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="40px"
                  className="logo-actual object-contain"
                />
                <Image
                  src="/media/Logo/gc-identidad-uniforme.webp"
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="40px"
                  className="logo-uniforme object-contain"
                />
              </div>
              <span className="font-display font-bold text-white text-lg">
                {nombre}
              </span>
            </div>
            <p className="text-sm font-body leading-relaxed mb-4">
              {corporacion}
            </p>
            <p className="text-sm font-body text-white/40">
              La Unión, Provincia del Ranco
              <br />
              Región de Los Ríos, Chile
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-body hover:text-gc-green-light transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentos */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Documentos
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/documentos" className="text-sm font-body hover:text-gc-green-light transition-colors">
                  Proyecto Educativo (PEI)
                </a>
              </li>
              <li>
                <a href="/documentos" className="text-sm font-body hover:text-gc-green-light transition-colors">
                  Reglamento de Convivencia
                </a>
              </li>
              <li>
                <a href="/documentos" className="text-sm font-body hover:text-gc-green-light transition-colors">
                  Reglamento de Evaluación
                </a>
              </li>
              <li>
                <a href="/documentos" className="text-sm font-body hover:text-gc-green-light transition-colors">
                  Ver todos los documentos →
                </a>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Síguenos
            </h4>
            <div className="flex gap-3">
              {redes.facebook && (
                <a
                  href={redes.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gc-gold/20 hover:border-gc-gold/30 transition-colors"
                  aria-label="Facebook"
                >
                  <IconoRed red="facebook" />
                </a>
              )}
              {redes.instagram && (
                <a
                  href={redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gc-gold/20 hover:border-gc-gold/30 transition-colors"
                  aria-label="Instagram"
                >
                  <IconoRed red="instagram" />
                </a>
              )}
              {redes.youtube && (
                <a
                  href={redes.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gc-gold/20 hover:border-gc-gold/30 transition-colors"
                  aria-label="YouTube"
                >
                  <IconoRed red="youtube" />
                </a>
              )}
              {redes.tiktok && (
                <a
                  href={redes.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gc-gold/20 hover:border-gc-gold/30 transition-colors"
                  aria-label="TikTok"
                >
                  <IconoRed red="tiktok" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="container-gc py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-body text-white/30">
            © {year} {nombre}. Todos los derechos reservados.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs font-body text-white/20">
              La Unión, Región de Los Ríos, Chile
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
