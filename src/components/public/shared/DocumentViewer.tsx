"use client";

import { useState } from "react";

export interface Documento {
  id: string;
  titulo: string;
  categoria: string;
  url: string;
  descripcion?: string;
}

interface DocumentViewerProps {
  documentos: Documento[];
  categorias: string[];
  initialDocId?: string;
}

export default function DocumentViewer({
  documentos,
  categorias,
  initialDocId,
}: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Documento>(
    (initialDocId && documentos.find((d) => d.id === initialDocId)) || documentos[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredDocs =
    activeCategory === "Todos"
      ? documentos
      : documentos.filter((d) => d.categoria === activeCategory);

  const handleSelectDoc = (doc: Documento) => {
    setSelectedDoc(doc);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">

      {/* Spacer para el Navbar fixed (h-16 mobile / h-20 desktop) */}
      <div className="h-16 lg:h-20 flex-shrink-0" />

      {/* ── BODY — ocupa el resto del viewport ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`
            fixed lg:static top-0 left-0 z-30 h-full
            w-72 bg-white border-r border-gc-gray-200
            flex flex-col
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Header sidebar — fijo */}
          <div className="flex-shrink-0">
            {/* Filtros + cerrar en una sola línea */}
            <div className="px-3 py-2 border-b border-gc-gray-200 flex items-center gap-1.5 flex-wrap">
              {["Todos", ...categorias].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-0.5 text-[11px] font-body font-medium rounded-full transition-colors ${
                    activeCategory === cat
                      ? "bg-gc-green-800 text-white"
                      : "bg-gc-gray-100 text-gc-gray-700 hover:bg-gc-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden ml-auto p-1 rounded-lg text-gc-gray-500 hover:bg-gc-gray-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lista de documentos — scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {categorias.map((categoria) => {
              const docsEnCategoria = filteredDocs.filter(
                (d) => d.categoria === categoria
              );
              if (docsEnCategoria.length === 0) return null;

              return (
                <div key={categoria}>
                  {activeCategory === "Todos" && (
                    <div className="px-3 pt-2.5 pb-0.5">
                      <span className="text-[10px] font-body font-semibold text-gc-gray-500 uppercase tracking-wider">
                        {categoria}
                      </span>
                    </div>
                  )}
                  {docsEnCategoria.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors border-l-2 ${
                        selectedDoc.id === doc.id
                          ? "bg-gc-gold/10 border-gc-gold"
                          : "border-transparent hover:bg-gc-cream"
                      }`}
                    >
                      {/* Icono PDF */}
                      <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-md bg-red-50 border border-red-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 15.5h7v1h-7v-1zm0-3h7v1h-7v-1zm0-3H11v1H8.5v-1z" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-body leading-snug ${
                            selectedDoc.id === doc.id
                              ? "text-gc-green-800 font-semibold"
                              : "text-gc-gray-700"
                          }`}
                        >
                          {doc.titulo}
                        </p>
                        {doc.descripcion && (
                          <p className="text-[10px] text-gc-gray-500 mt-0.5 leading-snug">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── PANEL PDF ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Toolbar del documento — fija */}
          <div className="flex-shrink-0 h-11 flex items-center gap-3 px-4 bg-white border-b border-gc-gray-200">
            {/* Hamburguesa mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-gc-green-800 hover:bg-gc-green-50 transition-colors flex-shrink-0"
              aria-label="Abrir lista de documentos"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Badge categoría + título */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="hidden sm:inline-flex flex-shrink-0 text-xs font-body font-medium px-2 py-0.5 rounded-full bg-gc-green-800/10 text-gc-green-800">
                {selectedDoc.categoria}
              </span>
              <h1 className="text-sm font-display font-semibold text-gc-green-800 truncate">
                {selectedDoc.titulo}
              </h1>
            </div>

            {/* Descargar */}
            <a
              href={selectedDoc.url}
              download
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gc-green-800 text-white text-xs font-body font-medium rounded-lg hover:bg-gc-green-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Descargar</span>
            </a>
          </div>

          {/* Visor PDF — ocupa todo el espacio restante */}
          <div className="flex-1 overflow-hidden bg-gc-gray-100">
            {/* Desktop: iframe — sin key para evitar remount y flash de layout */}
            <iframe
              src={`${selectedDoc.url}#view=FitH`}
              className="hidden md:block w-full h-full border-0"
              title={selectedDoc.titulo}
            />

            {/* Mobile: botón de apertura */}
            <div className="md:hidden flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 15.5h7v1h-7v-1zm0-3h7v1h-7v-1zm0-3H11v1H8.5v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-display font-semibold text-gc-green-800 text-base mb-1">
                  {selectedDoc.titulo}
                </p>
                <p className="text-sm font-body text-gc-gray-500">
                  Los PDFs se visualizan mejor en un navegador de escritorio.
                </p>
              </div>
              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Abrir documento
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
