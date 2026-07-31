# Documentación — Garden College Web

> Índice de todos los documentos del proyecto. La fuente de verdad del **código**
> es `src/`; la del **contenido** es `src/content/`. Las reglas no negociables
> están en [`CLAUDE.md`](../CLAUDE.md) (raíz).

---

## Contenido — empezar acá

| Documento | Descripción |
|-----------|-------------|
| [CONTENIDO.md](./CONTENIDO.md) | **Dónde se edita cada texto y foto del sitio.** No hay panel: el contenido son archivos. |
| [EVENTOS.md](./EVENTOS.md) | **Reglas para agregar y mantener eventos.** Estructura de carpetas, campos, versiones móviles de video (`-mobile`), cómo cambiar la edición de la galería. |

---

## Publicación y posicionamiento

| Documento | Descripción |
|-----------|-------------|
| [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) | **Cómo se publica el sitio.** Variables de entorno, dominio, por qué todo debe ser estático, y qué se eliminó al migrar desde el stack de Docker. Leer esto al recibir el repo en otra cuenta / otro Vercel. |
| [SEO.md](./SEO.md) | **Metadatos y datos estructurados.** Qué emite el sitio, cómo verificarlo, y los pendientes fuera del repo (Search Console, Google Business Profile). |

---

## Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [SETUP_DEV.md](./SETUP_DEV.md) | Setup del entorno local en una máquina nueva: Node, variables de entorno, comandos. |
| [UX_CONTEXT.md](./UX_CONTEXT.md) | Informe UX/UI completo: paleta real de colores, componentes, props de cada sección, API routes disponibles. |

---

## Auditorías y registros de trabajo

| Documento | Descripción |
|-----------|-------------|
| [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) | Auditoría de rendimiento: issues del Hero, galerías, optimizaciones. |
| [BACKLOG_UX_MOVIL.md](./BACKLOG_UX_MOVIL.md) | **Plan de UX móvil por ciclos** (0–5) con su estado: bytes de imagen, aspect-ratio, política de video, navegación, accesibilidad. |
| [REDTEAM.md](./REDTEAM.md) | Registro de un ejercicio de seguridad ofensiva (red-team) sobre el proyecto. |
| [BLUE_TEAM.md](./BLUE_TEAM.md) | Revisión defensiva (blue-team) contra normativa de seguridad vigente. |

---

## Admin Panel (no implementado — spec para el futuro)

> **Nada de esto está construido.** El contenido se edita en archivos (ver
> "Contenido" arriba). Estas specs quedan para el día que alguien del colegio
> necesite publicar sin desarrollador.

| Documento | Descripción |
|-----------|-------------|
| [admin/README.md](./admin/README.md) | Índice del admin — leer primero. |
| [admin/BLUEPRINT_EVENTOS.md](./admin/BLUEPRINT_EVENTOS.md) | **Blueprint de subpáginas de eventos** (Fomento Lector como modelo). Estructura de página, galerías llamables, campos editables, temporalidad. |
| [admin/REQUISITOS.md](./admin/REQUISITOS.md) | Checklist completo del panel: auth, CRUD, uploads, hardcodeo pendiente. |
| [admin/GALERIAS.md](./admin/GALERIAS.md) | Arquitectura de `GaleriaColumnas` y `GaleriaPolaroid` como componentes llamables. |
| [admin/DOCUMENTOS.md](./admin/DOCUMENTOS.md) | Blueprint del centro de documentos (`/documentos`). |
| [admin/SELLOS.md](./admin/SELLOS.md) | Guía editorial de la sección Sellos (ex Convivencia) para redactar el contenido. |
