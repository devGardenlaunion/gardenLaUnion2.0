# Panel Admin — Garden College · Índice

> Documentación técnica y funcional del panel de administración.
> Todos los requisitos aquí documentados asumen que la web pública ya funciona.

> ## ⚠️ Nada de esto está construido
>
> **El panel no existe.** El código a medias que había (`/admin`, NextAuth,
> Prisma, PostgreSQL) se eliminó al migrar a Vercel: el dashboard enlazaba a
> cuatro rutas que nunca se implementaron y ningún componente público usaba la
> base de datos. El detalle está en [../DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md).
>
> Estos documentos **siguen siendo la especificación válida** para el día que
> alguien del colegio necesite publicar sin desarrollador. Pero se escribieron
> cuando el proyecto tenía Prisma y PostgreSQL, así que dan por sentado un
> modelo de datos que hoy **no existe**: los bloques de esquema `prisma` que
> aparecen ahí son propuestas, no el esquema vigente.
>
> Mientras tanto el contenido se edita en archivos —ver
> [../CONTENIDO.md](../CONTENIDO.md)— y quien implemente el panel tendrá que
> decidir primero dónde va a vivir la base de datos (Vercel Postgres, Neon,
> Supabase) y cómo va a servir los medios, porque en Vercel `public/` es
> read-only.

---

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) | **Leer primero si vas a tocar Eventos.** Blueprint completo de subpáginas de eventos (Fomento Lector como modelo). Define estructura de página, componentes de galería y qué edita el admin. Todo evento nuevo sigue este blueprint. |
| [REQUISITOS.md](./REQUISITOS.md) | Checklist completo de lo que debe implementarse en el panel: autenticación, CRUD por sección, upload de archivos, pipeline de imágenes. Incluye hardcodeo pendiente de eliminar. |
| [DOCUMENTOS.md](./DOCUMENTOS.md) | Blueprint del centro de documentos PDF: modelo de BD, categorías, tags, upload de PDFs y migración desde el hardcodeo actual de `src/app/documentos/page.tsx`. |
| [GALERIAS.md](./GALERIAS.md) | Arquitectura de los componentes `GaleriaColumnas` y `GaleriaPolaroid`: cómo llamarlos, qué props reciben, estructura de carpetas, convención de thumbnails de video. |
| [SELLOS.md](./SELLOS.md) | Guía editorial de la sección Sellos (fusión de Sellos Educativos + Convivencia) para quien redacte el contenido. Relevante al implementar el editor de `ConfigSitio`. |

---

## Archivos de referencia fuera de esta carpeta

| Archivo | Por qué importa para el admin |
|---------|-------------------------------|
| `src/content/config.ts` | **El contenido actual.** Es lo que el panel tendría que reemplazar. No hay `schema.prisma`: se eliminó. |
| `src/components/public/shared/GaleriaColumnas.tsx` | Componente masonry — define el tipo `FotoColumnas` que el admin debe producir. |
| `src/components/public/shared/GaleriaPolaroid.tsx` | Componente polaroid — define el tipo `FotoPolaroid`. |
| `src/app/eventos/[slug]/page.tsx` | Página pública de eventos. El admin reemplaza la lectura desde filesystem por datos de BD. **Ojo:** hoy es SSG con `dynamicParams = false`; pasarla a dinámica requiere resolver antes de dónde salen los medios. |
| `src/lib/config.ts` | Cómo se leen las claves de contenido. Hoy lee de `src/content/config.ts`; el admin reemplazaría esa fuente conservando la firma. |
| `src/data/redes.ts` | **Hardcodeo pendiente de eliminar** — ver REQUISITOS.md sección "Hardcodeo". |
| `src/data/recursos.ts` | **Hardcodeo pendiente de migrar a BD** — ver REQUISITOS.md sección "Recursos externos". |
| `src/app/documentos/page.tsx` | **Catálogo de documentos hardcodeado** — ver DOCUMENTOS.md para la migración. |
| `src/components/public/sections/Recursos.tsx` | Headings de la sección hardcodeados — ver REQUISITOS.md sección "Hardcodeo". |

---

## Otros documentos del proyecto

| Archivo | Para qué sirve |
|---------|----------------|
| `docs/SETUP_DEV.md` | Setup del entorno de desarrollo local. |
| `docs/UX_CONTEXT.md` | Informe UX/UI completo: paleta real, componentes, props de cada sección, API routes. |
| `docs/PERFORMANCE_AUDIT.md` | Auditoría de rendimiento con issues pendientes del Hero y las galerías. |
| `CLAUDE.md` | Reglas no negociables, arquitectura, identidad visual, convenciones. |
