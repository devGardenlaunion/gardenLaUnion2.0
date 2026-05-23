# Panel Admin — Garden College · Índice

> Documentación técnica y funcional del panel de administración.
> Todos los requisitos aquí documentados asumen que la web pública ya funciona.
> La fuente de verdad del modelo de datos es `prisma/schema.prisma`.

---

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) | **Leer primero.** Blueprint completo de subpáginas de eventos (Fomento Lector como modelo). Define estructura de página, componentes de galería y qué edita el admin. Todo evento nuevo sigue este blueprint. |
| [REQUISITOS.md](./REQUISITOS.md) | Checklist completo de lo que debe implementarse en el panel: autenticación, CRUD por sección, upload de archivos, pipeline de imágenes. |
| [GALERIAS.md](./GALERIAS.md) | Arquitectura de los componentes `GaleriaColumnas` y `GaleriaPolaroid`: cómo llamarlos, qué props reciben, estructura de carpetas, convención de thumbnails de video. |
| [CONVIVENCIA.md](./CONVIVENCIA.md) | Guía editorial de la sección Convivencia para quien redacte el contenido. Relevante al implementar el editor de `ConfigSitio`. |

---

## Archivos de referencia fuera de esta carpeta

| Archivo | Por qué importa para el admin |
|---------|-------------------------------|
| `prisma/schema.prisma` | Modelo de datos actual. Ver migración pendiente en REQUISITOS.md antes de implementar subida de multimedia. |
| `src/components/public/shared/GaleriaColumnas.tsx` | Componente masonry — define el tipo `FotoColumnas` que el admin debe producir. |
| `src/components/public/shared/GaleriaPolaroid.tsx` | Componente polaroid — define el tipo `FotoPolaroid`. |
| `src/app/eventos/[slug]/page.tsx` | Página pública de eventos. El admin reemplaza la lectura desde filesystem por datos de BD. |
| `src/lib/config.ts` | Cómo se leen las claves `ConfigSitio`. El admin escribe en esta tabla. |
| `src/data/redes.ts` | **Hardcodeo pendiente de eliminar** — ver sección de hardcodeo en REQUISITOS.md. |
| `src/data/recursos.ts` | **Hardcodeo pendiente de migrar a BD** — ver REQUISITOS.md. |

---

## Otros documentos del proyecto

| Archivo | Para qué sirve |
|---------|----------------|
| `docs/SETUP_DEV.md` | Setup del entorno de desarrollo local. |
| `docs/UX_CONTEXT.md` | Informe UX/UI completo: paleta real, componentes, props de cada sección, API routes. |
| `docs/PERFORMANCE_AUDIT.md` | Auditoría de rendimiento con issues pendientes del Hero y las galerías. |
| `CLAUDE.md` | Reglas no negociables, arquitectura, identidad visual, convenciones. |
