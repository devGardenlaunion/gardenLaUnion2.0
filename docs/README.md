# Documentación — Garden College Web

> Índice de todos los documentos del proyecto. La fuente de verdad del código es
> `src/`, y la del **contenido** es `src/content/`. Las reglas no negociables
> están en `CLAUDE.md`.

---

## Contenido — empezar acá

| Documento | Descripción |
|-----------|-------------|
| [CONTENIDO.md](./CONTENIDO.md) | **Dónde se edita cada texto y foto del sitio.** No hay panel: el contenido son archivos. |
| [EVENTOS.md](./EVENTOS.md) | **Reglas para agregar y mantener eventos.** Estructura de carpetas, campos, cómo cambiar la edición de la galería. |

---

## Admin Panel (no implementado — spec para el futuro)

| Documento | Descripción |
|-----------|-------------|
| [admin/README.md](./admin/README.md) | Índice del admin — leer primero. **Nada de esto está construido**: el contenido se edita en archivos (ver arriba). |
| [admin/BLUEPRINT_EVENTOS.md](./admin/BLUEPRINT_EVENTOS.md) | **Blueprint de subpáginas de eventos** (Fomento Lector como modelo). Estructura de página, galerías llamables, campos editables, temporalidad. |
| [admin/REQUISITOS.md](./admin/REQUISITOS.md) | Checklist completo del panel: auth, CRUD, uploads, hardcodeo pendiente. |
| [admin/GALERIAS.md](./admin/GALERIAS.md) | Arquitectura de GaleriaColumnas y GaleriaPolaroid como componentes llamables. |
| [admin/SELLOS.md](./admin/SELLOS.md) | Guía editorial de la sección Sellos (ex Convivencia) para redactar el contenido. |

---

## Publicación y posicionamiento

| Documento | Descripción |
|-----------|-------------|
| [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) | **Cómo se publica el sitio.** Variables de entorno, dominio, por qué todo debe ser estático, y el registro de qué se eliminó al migrar desde el stack de Docker. |
| [SEO.md](./SEO.md) | **Metadatos y datos estructurados.** Qué emite el sitio, cómo verificarlo, y los pendientes fuera del repo (Search Console, Google Business Profile). |

---

## Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [SETUP_DEV.md](./SETUP_DEV.md) | Setup del entorno local: variables de entorno, comandos. |
| [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) | Auditoría de rendimiento: issues del Hero, galerías, y optimizaciones pendientes. |
| [UX_CONTEXT.md](./UX_CONTEXT.md) | Informe UX/UI completo: paleta real de colores, componentes, props de cada sección, API routes disponibles. |
