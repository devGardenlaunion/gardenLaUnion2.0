# Garden College — Web pública

Sitio del colegio Garden College, La Unión, Región de Los Ríos, Chile.

**Stack:** Next.js 16 (App Router) · TypeScript · TailwindCSS · Vercel
**Producción:** https://gardenlaunion.cl

---

## Lo primero que hay que saber

**No hay base de datos ni panel de administración.** El contenido son archivos
del repositorio:

- Textos → `src/content/config.ts`
- Eventos → `src/content/eventos.ts`
- Fotos y videos → `public/media/`
- Documentos PDF → `public/documentos/`

Se edita, se commitea, se pushea, y el deploy publica. Git ya da historial y
rollback. Guías: [`docs/CONTENIDO.md`](docs/CONTENIDO.md) y
[`docs/EVENTOS.md`](docs/EVENTOS.md).

---

## Desarrollo local

Requiere **Node.js 20 o superior** (Next 16 no corre en 18).

```bash
git clone <repo-url> garden-web
cd garden-web

cp .env.example .env    # opcional: solo hace falta para el formulario de contacto
npm install
npm run dev             # http://localhost:3000
```

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción — **el único chequeo obligatorio antes de pushear** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Detalle del entorno local en [`docs/SETUP_DEV.md`](docs/SETUP_DEV.md).

---

## Deploy

`git push` a `main`. Vercel construye y publica.

Guía completa —variables de entorno, dominio, y por qué el sitio tiene que ser
100% estático— en [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

> **Antes de tocar el renderizado:** las páginas leen `public/media/` con `fs`,
> y en Vercel esa carpeta no viaja dentro de la función serverless. Cualquier
> página que se vuelva ISR o SSR se publica sin fotos y sin errores visibles.
> En la salida de `npm run build`, la única ruta `ƒ (Dynamic)` debe ser
> `/api/contacto`.

---

## Estructura

```
CLAUDE.md              → Reglas del proyecto (leer PRIMERO)
src/content/           → EL CONTENIDO: textos y eventos
src/app/(public)/      → Onepage pública
src/app/eventos/       → Subpáginas de eventos
src/app/documentos/    → Centro de documentación
src/lib/seo.ts         → Canonical + datos estructurados
public/media/          → Fotos y videos por sección
docs/                  → Documentación
```

---

## Documentación

Índice completo en [`docs/README.md`](docs/README.md). Los de uso frecuente:

| Documento | Para qué |
|-----------|----------|
| [docs/CONTENIDO.md](docs/CONTENIDO.md) | Dónde se edita cada texto y foto |
| [docs/EVENTOS.md](docs/EVENTOS.md) | Cómo agregar y mantener eventos |
| [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) | Publicación y configuración de Vercel |
| [docs/SEO.md](docs/SEO.md) | Metadatos, datos estructurados y pendientes de posicionamiento |
