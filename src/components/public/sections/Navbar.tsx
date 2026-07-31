"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  { label: "Sellos", href: "#sellos" },
  { label: "Historias", href: "#eventos" },
  { label: "Niveles", href: "#niveles" },
  { label: "Recursos", href: "#recursos" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar({ nombre, telefonoBasica, telefonoMedia, variant = "transparent" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Ciclo 4: scroll-spy. (El hide-on-scroll se retiró: en móvil el nav SIEMPRE
  // queda visible — perder el acceso al menú en celular no es aceptable.)
  const [activeId, setActiveId] = useState("");
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    if (closeMenu) setIsOpen(false);
  };

  // Scroll restoration: el fix del F5 (evitar que la restauración del browser
  // pise el scrollIntoView) sólo hace falta cuando la URL trae hash — ahí se
  // pone "manual". Sin hash dejamos "auto", así el botón atrás recupera la
  // posición de scroll previa (Ciclo 4, criterio de back-restore).
  useEffect(() => {
    if (isOnepage && "scrollRestoration" in history) {
      history.scrollRestoration = window.location.hash ? "manual" : "auto";
    }
  }, [isOnepage]);

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll(); // sincroniza estado inicial al recargar con scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  // Scroll-spy: marca la sección visible en el menú.
  useEffect(() => {
    if (!isOnepage) return;
    const secciones = navLinks
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => !!el);
    if (secciones.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibles[0]) setActiveId(visibles[0].target.id);
      },
      // banda de activación ~mitad superior del viewport
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    secciones.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [isOnepage]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
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
            {/* Comportamiento/tamaño traídos de la rama del uniforme.
                Diámetro > alto del nav (h-16=64 / lg:h-20=80): el logo REBOSA la
                barra. Dos estados con animación de acomodo:
                  · arriba (!isLight): centrado, rebosando por arriba y abajo.
                  · scrolleado (isLight): baja 7px = 4px (excedente superior al
                    centrarse) + 3px del aro (ring se dibuja por fuera). Así el
                    borde del aro queda al ras del nav y el resto cuelga abajo.
                translate-y es visual: no agranda la fila ni mueve los links. */}
            <div
              className={`relative w-14 h-14 lg:w-[5.5rem] lg:h-[5.5rem] shrink-0 rounded-full overflow-hidden bg-white p-0.5 ring-[3px] ring-gc-gold shadow-md transition-transform duration-300 ease-out ${
                // Móvil: el logo CABE dentro del nav (56px + aro dentro de los
                // 64px de la barra) → no rebosa ni hacia arriba ni hacia abajo,
                // así el borde superior nunca se corta contra el viewport cuando
                // el navegador esconde la barra de direcciones al scrollear.
                // Desktop: logo grande que rebosa la barra, con acomodo al scroll
                // (ahí sí hay espacio arriba por la barra de teléfonos).
                isLight ? "translate-y-0 lg:translate-y-[7px]" : "translate-y-0"
              }`}
            >
              {/* Loop del logo: escudo institucional ↔ monograma GC (crossfade 8s,
                  ver @keyframes logo-swap en globals.css). El escudo es la base y
                  lleva el alt real; el GC (.logo-swap) se funde encima. El GC es un
                  raster con el color horneado, así que van dos —verde para el tema
                  actual, navy para el uniforme— y CSS muestra el que corresponde
                  según data-theme (.logo-actual/.logo-uniforme). */}
              <Image
                src="/media/Logo/leon-circulo.webp"
                alt="Escudo de Garden College"
                fill
                loading="eager"
                sizes="88px"
                className="object-contain p-0.5"
              />
              <Image
                src="/media/Logo/gc-identidad.webp"
                alt=""
                aria-hidden="true"
                fill
                loading="eager"
                sizes="88px"
                className="logo-actual logo-swap object-contain p-0.5"
              />
              <Image
                src="/media/Logo/gc-identidad-uniforme.webp"
                alt=""
                aria-hidden="true"
                fill
                loading="eager"
                sizes="88px"
                className="logo-uniforme logo-swap object-contain p-0.5"
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
            {navLinks.map((link) => {
              const esActivo = isOnepage && activeId === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={resolveHref(link)}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  aria-current={esActivo ? "true" : undefined}
                  className={`px-3 py-2 text-sm font-body rounded-lg transition-colors ${
                    esActivo ? "font-bold" : "font-medium"
                  } ${
                    isLight
                      ? esActivo
                        ? "text-gc-green bg-gc-green/10"
                        : "text-gc-green-800/70 hover:text-gc-green-800 hover:bg-gc-green/10"
                      : esActivo
                        ? "text-white bg-white/15"
                        : "text-white/80 hover:text-white hover:bg-gc-green/10"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
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
            className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
              isLight
                ? "text-gc-green-800 hover:bg-gc-green/10"
                : "text-white hover:bg-gc-green/10"
            }`}
            aria-label="Menú"
            aria-expanded={isOpen}
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
            {navLinks.map((link) => {
              const esActivo = isOnepage && activeId === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={resolveHref(link)}
                  onClick={(e) => handleAnchorClick(e, link.href, true)}
                  aria-current={esActivo ? "true" : undefined}
                  className={`block px-4 py-3 font-body rounded-lg transition-colors ${
                    esActivo
                      ? "font-bold text-gc-green bg-gc-green/10"
                      : "text-gc-green-800 font-medium hover:bg-gc-green/10"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <div className="pt-2">
              <a
                href={!isOnepage ? "/#admision" : "#admision"}
                onClick={(e) => handleAnchorClick(e, "#admision", true)}
                className="btn-primary w-full text-center"
              >
                Admisión 2026
              </a>
            </div>
            {/* Ciclo 4: acceso a llamada en el menú (en móvil no hay barra de
                teléfonos). Targets ≥44px. */}
            {(telefonoBasica || telefonoMedia) && (
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-1">
                {telefonoBasica && (
                  <a
                    href={`tel:+56${telefonoBasica.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-gc-green-800 font-body font-medium rounded-lg hover:bg-gc-green/10 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                    <span className="text-gc-green-800/60 mr-1">Básica</span>{telefonoBasica}
                  </a>
                )}
                {telefonoMedia && (
                  <a
                    href={`tel:+56${telefonoMedia.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-gc-green-800 font-body font-medium rounded-lg hover:bg-gc-green/10 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                    <span className="text-gc-green-800/60 mr-1">Media</span>{telefonoMedia}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
