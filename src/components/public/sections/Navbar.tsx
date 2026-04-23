"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { redesSociales } from "@/data/redes";

interface NavbarProps {
  nombre: string;
  telefonoBasica?: string;
  telefonoMedia?: string;
  variant?: "transparent" | "solid";
}

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Quiénes Somos", href: "#quienes-somos" },
  { label: "Convivencia", href: "#convivencia" },
  { label: "Eventos", href: "#eventos" },
  { label: "Niveles", href: "#niveles" },
  { label: "Recursos", href: "#recursos" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar({ nombre, telefonoBasica, telefonoMedia, variant = "transparent" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isOnepage = pathname === "/";

  // En modo solid siempre se comporta como si estuviera scrolled
  const isLight = variant === "solid" || scrolled;

  // Fuera de la onepage, los anchors deben volver a /#seccion
  const resolveHref = (link: { href: string }) => {
    if (!isOnepage && link.href.startsWith("#")) return `/${link.href}`;
    return link.href;
  };

  const logoHref = isOnepage ? "#inicio" : "/";

  // Scroll imperativo para evitar race conditions con scroll restoration del browser
  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    closeMenu = false,
  ) => {
    if (!isOnepage || !href.startsWith("#")) return;
    e.preventDefault();
    const id = href.slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    if (closeMenu) setIsOpen(false);
  };

  // Deshabilita scroll restoration del browser en la onepage para evitar
  // que pise los scrollIntoView programáticos (race condition en F5).
  useEffect(() => {
    if (isOnepage && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, [isOnepage]);

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll(); // sincroniza estado inicial al recargar con scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLight
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b-2 border-gc-navy"
          : "bg-gc-green-900 border-b-2 border-gc-green-800"
      }`}
    >
      {/* Barra superior — solo desktop */}
      {!isLight && (
        <div className="hidden lg:block bg-gc-green-800 text-white/80 text-sm">
          <div className="container-gc flex justify-between items-center py-1.5">
            <div className="flex items-center gap-4 font-body">
                {telefonoBasica && (
                  <span>
                    <span className="text-white/50 mr-1">Básica</span>
                    {telefonoBasica}
                  </span>
                )}
                {telefonoBasica && telefonoMedia && (
                  <span className="text-white/30">|</span>
                )}
                {telefonoMedia && (
                  <span>
                    <span className="text-white/50 mr-1">Media</span>
                    {telefonoMedia}
                  </span>
                )}
              </div>
            <div className="flex items-center gap-4">
              <span className="font-body text-gc-gold-light">
                Corporación Educacional Filadelfia Garden
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={redesSociales.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={redesSociales.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href={redesSociales.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra principal */}
      <div className="container-gc">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo + Nombre */}
          <a href={logoHref} className="flex items-center gap-3 group">
            <div className="w-14 h-14 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full overflow-hidden bg-white shadow-md p-0.5 shrink-0 -my-2">
              <img
                src="/media/Logo/cropped-cropped-logo.png"
                alt="Logo Garden College"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span
                className={`font-display font-bold text-lg lg:text-xl transition-colors ${
                  isLight ? "text-gc-green-800" : "text-white"
                }`}
              >
                {nombre}
              </span>
            </div>
          </a>

          {/* Links — desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={resolveHref(link)}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={`px-3 py-2 text-sm font-body font-medium rounded-lg transition-colors ${
                  isLight
                    ? "text-gc-green-800/70 hover:text-gc-green-800 hover:bg-gc-green/10"
                    : "text-white/80 hover:text-white hover:bg-gc-green/10"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={!isOnepage ? "/#admision" : "#admision"}
              onClick={(e) => handleAnchorClick(e, "#admision")}
              className="btn-primary ml-3 text-sm !py-2"
            >
              Admisión
            </a>
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isLight
                ? "text-gc-green-800 hover:bg-gc-green/10"
                : "text-white hover:bg-gc-green/10"
            }`}
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="container-gc py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={resolveHref(link)}
                onClick={(e) => handleAnchorClick(e, link.href, true)}
                className="block px-4 py-3 text-gc-green-800 font-body font-medium rounded-lg hover:bg-gc-green/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <a
                href={!isOnepage ? "/#admision" : "#admision"}
                onClick={(e) => handleAnchorClick(e, "#admision", true)}
                className="btn-primary w-full text-center"
              >
                Admisión 2026
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
