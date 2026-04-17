"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type MultimediaItem = {
  id: string;
  tipo: string;
  url: string;
  thumbnail: string | null;
  titulo: string | null;
  orden: number;
};

export type EdicionMinima = {
  id: string;
  titulo: string;
  slug: string;
  fecha: string;
};

export type EdicionModal = {
  id: string;
  titulo: string;
  slug: string;
  extracto: string;
  contenido: string;
  imagenPortada: string | null;
  fecha: string;
  destacada: boolean;
  evento: {
    id: string;
    nombre: string;
    slug: string;
    recurrencia: string;
    ediciones: EdicionMinima[];
  };
  multimedia: MultimediaItem[];
};

interface EventModalProps {
  edicion: EdicionModal;
  onClose: () => void;
}

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : null;
}

export default function EventModal({ edicion: initialEdicion, onClose }: EventModalProps) {
  const [current, setCurrent] = useState<EdicionModal>(initialEdicion);
  const [loading, setLoading] = useState(false);
  const [activeVideos, setActiveVideos] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // ESC para cerrar
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Cambiar a otra edición sin cerrar el modal
  async function switchEdicion(slug: string) {
    if (slug === current.slug || loading) return;
    setLoading(true);
    setActiveVideos(new Set());
    try {
      const res = await fetch(`/api/eventos/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCurrent(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/eventos/${current.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fotos = current.multimedia.filter((m) => m.tipo === "foto");
  const videos = current.multimedia.filter((m) => m.tipo === "youtube");
  const links = current.multimedia.filter(
    (m) => m.tipo === "instagram" || m.tipo === "facebook"
  );
  const otrasEdiciones = current.evento.ediciones.filter(
    (e) => e.slug !== current.slug
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gc-green-900/60 backdrop-blur-sm" />

      {/* Contenido */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto">
        {/* Loader overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-2 border-gc-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Imagen o fondo */}
        <div className="aspect-video relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-gc-green-800 to-gc-green-900">
          {current.imagenPortada ? (
            <img
              src={current.imagenPortada}
              alt={current.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gc-gold/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-gc-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </div>
            </div>
          )}
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 lg:p-8">
          {/* Badge evento + recurrencia */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-gc-green/10 text-gc-green-dark text-xs font-semibold rounded-full border border-gc-green/20">
              {current.evento.nombre} · {current.evento.recurrencia}
            </span>
            <time className="text-sm text-gc-green-800/50 font-body">
              {format(new Date(current.fecha), "d 'de' MMMM, yyyy", { locale: es })}
            </time>
          </div>

          {/* Título */}
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-gc-green-800 mb-4 leading-tight">
            {current.titulo}
          </h2>

          {/* Contenido HTML */}
          <div
            className="prose prose-green max-w-none font-body text-gc-green-800/80 leading-relaxed mb-6
                       prose-headings:font-display prose-headings:text-gc-green-800
                       prose-p:text-gc-green-800/80 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: current.contenido }}
          />

          {/* Multimedia: fotos */}
          {fotos.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-3">
                Galería
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fotos.map((foto) => (
                  <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-gc-green/10">
                    <img
                      src={foto.thumbnail || foto.url}
                      alt={foto.titulo || ""}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multimedia: videos YouTube (lazy) */}
          {videos.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-3">
                Video
              </p>
              <div className="grid gap-3">
                {videos.map((video) => {
                  const ytId = getYoutubeId(video.url);
                  if (!ytId) return null;
                  const isActive = activeVideos.has(video.id);
                  return (
                    <div key={video.id} className="rounded-xl overflow-hidden aspect-video bg-black">
                      {isActive ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <button
                          onClick={() =>
                            setActiveVideos((prev) => new Set(prev).add(video.id))
                          }
                          className="relative w-full h-full group"
                          aria-label={`Reproducir: ${video.titulo || "video"}`}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={video.titulo || ""}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          {video.titulo && (
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-sm font-body font-medium drop-shadow text-left line-clamp-1">
                                {video.titulo}
                              </p>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multimedia: links redes sociales */}
          {links.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-3">
                Redes Sociales
              </p>
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gc-green-50 border border-gc-green-100 text-gc-green-800 text-sm font-body rounded-full hover:bg-gc-green hover:text-white hover:border-gc-green transition-colors"
                  >
                    {link.tipo === "instagram" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    {link.titulo || link.tipo}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Otras ediciones del mismo evento */}
          {otrasEdiciones.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-body font-semibold text-gc-green-800/40 uppercase tracking-wider mb-3">
                Ediciones anteriores
              </p>
              <div className="flex flex-wrap gap-2">
                {otrasEdiciones.map((ed) => (
                  <button
                    key={ed.slug}
                    onClick={() => switchEdicion(ed.slug)}
                    className="px-4 py-2 bg-gc-green-50 border border-gc-green-100 text-gc-green-800 text-sm font-body rounded-full hover:bg-gc-green hover:text-white hover:border-gc-green transition-colors"
                  >
                    {format(new Date(ed.fecha), "yyyy", { locale: es })} — {ed.titulo.substring(0, 35)}{ed.titulo.length > 35 ? "…" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="sticky bottom-0 bg-white border-t border-gc-green-100 px-6 lg:px-8 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gc-green-50 border border-gc-green-100 text-gc-green-800 text-sm font-body font-medium rounded-xl hover:bg-gc-green hover:text-white hover:border-gc-green transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                ¡Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Compartir
              </>
            )}
          </button>
          <a
            href={`/eventos/${current.slug}`}
            className="text-sm font-body text-gc-green-800/50 hover:text-gc-green-800 transition-colors"
          >
            Ver página completa →
          </a>
          <button
            onClick={onClose}
            className="btn-ghost text-sm !py-2 !px-4"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
