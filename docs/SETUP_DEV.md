# Setup de Desarrollo — Garden College Web

> Documento escrito para sobrevivir un formateo de SO. Si estás leyendo esto
> después de reinstalar, sigue los pasos en orden.

---

## Stack real (como funciona hoy)

| Capa | Herramienta | Dónde vive |
|------|-------------|------------|
| Framework | Next.js 16 (App Router) | Local |
| Contenido | Archivos del repo (`src/content/`, `public/media/`) | Git |
| Base de datos | **Ninguna** | — |
| Deploy | **Vercel** | Auto-deploy en cada push a `main` |

> **No hay base de datos.** Neon, Prisma y el panel admin se retiraron: ningún
> código los usaba y el panel eran cuatro 404 detrás de un login. El detalle
> está en [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).
>
> **Tampoco hay Docker.** El `Dockerfile` y los `docker-compose.yml` se
> eliminaron: existían para un deploy en Oracle Cloud que no ocurrió, y ya no
> construían sin Prisma.

---

## Requisitos del sistema

**Node.js 20 o superior.** Next 16 no corre en 18 — falla con
`Node.js version ">=20.9.0" is required`.

```bash
# Arch Linux
sudo pacman -S nodejs npm git

# Verificar
node --version   # 20.x, 22.x o superior
npm --version
```

Alternativa con nvm o fnm (recomendada si hay varios proyectos con versiones
distintas):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # o el archivo de tu shell
nvm install 20
nvm use 20
```

---

## Paso 1 — Clonar el repo

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git gardenLaUnion2.0
cd gardenLaUnion2.0
```

---

## Paso 2 — Crear el archivo `.env`

```bash
cp .env.example .env
```

Para desarrollo basta con:

```env
SITE_URL=http://localhost:3000
```

**El resto es opcional.** Las variables `SMTP_*` sólo afectan al formulario de
contacto: sin ellas el sitio anda igual, pero enviar el formulario devuelve
error 502. Si necesitás probar el envío, completá las seis variables de correo
según [`.env.example`](../.env.example).

---

## Paso 3 — Instalar dependencias

```bash
npm install
```

---

## Paso 4 — Arrancar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Listo. No hay migraciones
ni seed que correr: el contenido son archivos que ya están en el repo.

---

## Antes de pushear

```bash
npm run build
```

Es lo mismo que corre Vercel, así que si pasa acá pasa allá. Dos cosas a
revisar en la salida:

1. Que no haya errores de TypeScript (el build los chequea).
2. Que la **única** ruta marcada `ƒ (Dynamic)` sea `/api/contacto`. Si aparece
   otra, el sitio se va a publicar sin fotos — el porqué está en
   [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md#por-qué-el-sitio-es-100-estático).

---

## Deploy a producción

**No hay comando manual.** Commit y push a `main`; Vercel despliega en ~2-3
minutos.

Variables de entorno de producción: Vercel dashboard → proyecto → **Settings →
Environment Variables**. Guía completa en
[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md).

---

## Comandos útiles

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción (chequeo obligatorio antes de pushear)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint

node scripts/generar-og-image.js   # regenera la tarjeta de redes sociales
node scripts/probar-smtp.js        # verifica el correo del formulario de contacto
```

---

## Dónde se edita el contenido

| Qué | Dónde |
|-----|-------|
| Textos del sitio | `src/content/config.ts` |
| Eventos / historias | `src/content/eventos.ts` |
| Fotos y videos | `public/media/<Seccion>/` |
| Documentos PDF | `public/documentos/` + la lista en `src/app/documentos/page.tsx` |

Guías: [CONTENIDO.md](./CONTENIDO.md) y [EVENTOS.md](./EVENTOS.md).
