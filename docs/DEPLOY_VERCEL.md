# Deploy en Vercel

> Cómo se publica el sitio, qué necesita para funcionar, y el registro de la
> migración desde el stack de Docker + PostgreSQL.
>
> Dominio de producción: **https://gardenlaunion.cl**

---

## Cómo se publica

`git push` a `main`. Eso es todo.

Vercel detecta el push, corre `next build` y publica. No hay servidor que
mantener, ni base de datos, ni contenedores, ni certificados que renovar.

Los pushes a otras ramas generan un **preview** con URL propia. Los previews
están bloqueados para buscadores (ver `src/app/robots.ts`), así que no compiten
con el sitio real en Google.

---

## Configuración del proyecto en Vercel

| Ajuste | Valor |
|--------|-------|
| Framework Preset | Next.js (autodetectado) |
| Build Command | `next build` (por defecto) |
| Output Directory | `.next` (por defecto) |
| Install Command | `npm install` (por defecto) |
| Node.js Version | 20.x o superior — fijado en `package.json` → `engines` |
| Root Directory | `./` |

**No hace falta tocar nada de esto.** Next 16 + Vercel se entienden solos.

### Variables de entorno

Solo dos grupos, ambos en *Settings → Environment Variables*. Ver
[`.env.example`](../.env.example) para el detalle de cada una.

| Variable | Entorno | Obligatoria |
|----------|---------|-------------|
| `SITE_URL` | Production | **Sí** — sin ella los canonicals apuntan a `localhost` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Production, Preview | Solo para el formulario de contacto |
| `CONTACTO_FROM`, `CONTACTO_FROM_NAME`, `CONTACTO_TO` | Production, Preview | Solo para el formulario de contacto |

`SITE_URL` va **únicamente en Production**. En los previews se deja vacía a
propósito: así el código cae en `VERCEL_URL` y cada preview se referencia a sí
mismo en vez de a producción.

### Dominio

1. *Settings → Domains* → agregar `gardenlaunion.cl` y `www.gardenlaunion.cl`.
2. Apuntar el DNS del registrador a Vercel (`A` a la IP que indique Vercel, o
   `CNAME` de `www`).
3. `next.config.js` ya redirige `www.gardenlaunion.cl` → `gardenlaunion.cl` con
   301 permanente. Google trata `www` y el apex como sitios distintos: sin el
   redirect, el posicionamiento se reparte entre los dos.

---

## Por qué el sitio es 100% estático

**Esto no es una optimización — es un requisito.** Si alguien vuelve a poner
`export const revalidate` o SSR en una página, el sitio se rompe en silencio.

Las páginas leen las fotos y videos con `fs.readdirSync()` sobre
`public/media/` (ver `src/lib/media.ts`). En Vercel, `public/` se sirve desde el
CDN y **no viaja dentro del bundle de la función serverless**. Un render en
runtime encontraría las carpetas vacías y publicaría la home sin fotos, sin
video de portada y sin galería — encima de la versión buena, sin ningún error
visible en los logs.

Por eso:

| Página | Estrategia | Cómo se garantiza |
|--------|-----------|-------------------|
| `/` | Estática | `export const dynamic = "force-static"` |
| `/eventos/[slug]` | SSG | `generateStaticParams()` + `export const dynamicParams = false` |
| `/documentos` | Estática | El `?doc=` se resuelve en el cliente, no con `searchParams` |
| `/sitemap.xml`, `/robots.txt` | Estáticas | Generadas en el build |
| `/api/contacto` | Dinámica | Es un `POST`; no lee `public/` |

No se pierde nada con ser estático: el contenido vive en `src/content/` y en
`public/media/`, o sea que **sólo cambia con un push** — y cada push dispara un
build nuevo. El antiguo `revalidate = 60` regeneraba cada minuto un contenido
que no cambiaba nunca.

Verificar después de cada cambio grande: en la salida de `npm run build`, la
única ruta marcada `ƒ (Dynamic)` debe ser `/api/contacto`.

---

## Qué se eliminó en la migración y por qué

Todo esto existía para el deploy en Oracle Cloud con Docker. En Vercel no tiene
función, y la mitad ya estaba roto.

### Infraestructura Docker

| Eliminado | Motivo |
|-----------|--------|
| `Dockerfile` | Dependía de Prisma en 5 pasos (`prisma generate`, copia de `node_modules/.prisma`, `prisma migrate deploy` en el `CMD`). Sin Prisma no construía. |
| `docker-compose.yml`, `docker-compose.dev.yml` | Orquestaban app + PostgreSQL + nginx + certbot. Nada de eso existe en Vercel. |
| `.dockerignore` | Sin Dockerfile no aplica. |
| `nginx/nginx.conf` | Vercel pone su propio edge delante. **Las cabeceras de seguridad que emitía nginx se migraron a `next.config.js`** — ver más abajo. |
| `output: 'standalone'` en `next.config.js` | Era para reducir el tamaño del container. En Vercel sólo agrandaba la función. |
| `scripts/backup.sh`, `scripts/restore.sh` | Backup/restore de PostgreSQL. Sin base de datos no hay nada que respaldar: **el contenido está en git**, que ya da historial y rollback. |

### Base de datos y panel admin

| Eliminado | Motivo |
|-----------|--------|
| `prisma/` (schema, migraciones, seed) | Ningún código lo usaba. `/api/contacto` ya había migrado a nodemailer; sólo quedaban `lib/auth.ts` y `/api/health` apuntando a Prisma. |
| `src/app/(admin)/` | El dashboard enlazaba a `/admin/noticias`, `/admin/galeria`, `/admin/institucional` y `/admin/mensajes` — **ninguna existe**: cuatro 404 detrás de un login. |
| `src/app/api/auth/[...nextauth]/`, `src/lib/auth.ts`, `src/components/admin/AuthProvider.tsx` | Autenticación de un panel que no existe. Un endpoint de auth público es superficie de ataque a cambio de nada. |
| `src/lib/prisma.ts` | Único consumidor restante tras lo anterior. |
| `src/app/api/health/` | Healthcheck del container de Docker (`wget` contra `/api/health`). Vercel no lo usa. |
| `src/app/api/media/galeria/` | **Nadie lo llamaba** — `Galeria.tsx` lee el filesystem directo. Además habría fallado en Vercel: hace `fs.readdirSync()` sobre `public/` desde una función serverless. |
| `scripts/update-fomento-texto.ts` | Script de un solo uso que escribía en la BD. Ese texto vive hoy en `src/content/eventos.ts`. |

La especificación del panel **sigue vigente** en
[`admin/REQUISITOS.md`](./admin/REQUISITOS.md) para el día que alguien del
colegio necesite publicar sin desarrollador. Lo que se borró es el código a
medias, no el plan.

### Dependencias npm

Removidas: `@prisma/client`, `prisma`, `next-auth`, `ts-node` (sólo servía al
seed de Prisma), y tres que **no importaba ningún archivo**: `slugify`,
`isomorphic-dompurify` y `date-fns-tz`.

### Otros huérfanos

- Carpetas de media vacías: `public/media/{Convivencia,Noticias,Sellos,Contacto,LoadingOverlay}/`.
  Ninguna se leía desde el código.
- `tsconfig.tsbuildinfo` y `next-env.d.ts` estaban **versionados en git**.
  Son artefactos de build regenerables; ahora están en `.gitignore`.

---

## Cabeceras de seguridad

Las emitía nginx. Ahora las emite Next para todas las rutas
(`next.config.js` → `headers()`):

| Cabecera | Valor |
|----------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `X-DNS-Prefetch-Control` | `on` |

El sitio no pide cámara, micrófono ni ubicación: el mapa es Leaflet sobre tiles
de OpenStreetMap y no geolocaliza al visitante.

---

## Formulario de contacto — configuración del correo

El código está completo (`ContactForm.tsx` → `/api/contacto` → `src/lib/mail.ts`).
Lo único que hace falta son las credenciales del proveedor de envío.

**Es la única funcionalidad del sitio que depende de variables de entorno.** Si
faltan, el build pasa igual y todo el resto funciona: sólo el envío devuelve 502.
Por eso hay que probarlo a mano — no hay forma de que un build falle por esto.

### Por qué Resend y no el Workspace del colegio

Se intentó primero con SMTP de Google Workspace. La política de la organización
bloquea las contraseñas de aplicación, y **bajar esa política no era una opción
razonable**: debilitaría la seguridad de todas las cuentas del colegio —incluidas
las que manejan datos de estudiantes— por una funcionalidad periférica.

Resend además resuelve mejor el problema real: mejor entregabilidad desde
funciones serverless que Gmail, no expone ninguna credencial de Google, y la
verificación del dominio (SPF/DKIM) mejora la reputación de `gardenlaunion.cl`
para todo el correo que salga de ahí.

### Configuración inicial

1. Crear cuenta en <https://resend.com> (3.000 correos/mes gratis; el colegio
   manda muchísimo menos).
2. **Verificar el dominio**: *Domains* → *Add Domain* → `gardenlaunion.cl`.
   Resend entrega unos registros DNS (SPF, DKIM y opcionalmente DMARC) que hay
   que cargar en el registrador del dominio. Propagan en minutos a algunas horas.
3. **Crear una API key**: *API Keys* → *Create*. Con permiso de envío alcanza —
   no darle acceso total. Se muestra una sola vez.
4. Completar en `.env` (local) y en Vercel (producción):

   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=<la API key, empieza con re_>
   CONTACTO_FROM=web@gardenlaunion.cl
   CONTACTO_FROM_NAME=Garden College Web
   CONTACTO_TO=<dónde llegan los avisos>
   ```

> ### `SMTP_USER` NO es el remitente
>
> Con Resend, `SMTP_USER` es **la palabra literal `resend`** — es el nombre de
> usuario del servidor SMTP, no una dirección. La dirección del remitente sale
> de `CONTACTO_FROM`, y por eso son variables separadas en `src/lib/mail.ts`.
>
> Antes el código armaba el `From` con `SMTP_USER` (con Gmail coincidían). Si se
> vuelve a mezclar, el correo sale con `From: resend` y se rechaza.

`CONTACTO_TO` puede ser distinta de `contacto.email` en
`src/content/config.ts`: la del contenido es la que **ve** el apoderado en la
web; `CONTACTO_TO` es dónde caen los avisos internos.

### Mientras el dominio no esté verificado

Resend sólo deja enviar desde `onboarding@resend.dev`, y **únicamente al correo
con el que se creó la cuenta**. Sirve para comprobar que la API key funciona,
pero no para una prueba real del formulario. Para eso hay que terminar la
verificación DNS.

### Verificar

```bash
node scripts/probar-smtp.js
```

Envía un correo real a `CONTACTO_TO` y separa dos problemas que desde el
navegador se ven idénticos: credenciales mal puestas vs. bug en el formulario.
Detecta los errores típicos (API key inválida, dominio sin verificar, puerto
bloqueado) y los explica en la salida.

Después, probar el formulario en el navegador de punta a punta. Ojo con el
antispam propio: **un envío en menos de 3 segundos se descarta como bot** y
responde `201 ok` sin mandar nada (a propósito: devolver error le enseña al bot
qué evitar). Al probar, llenar el formulario con calma.

### Cómo llega el correo

Sale desde `CONTACTO_FROM`, pero el `Reply-To` es el email del apoderado: al
apretar "Responder" se le contesta directo a la persona. El cuerpo incluye un
bloque de metadata (IP, ubicación aproximada, navegador, referer) por si alguna
vez hay que reportar un abuso.

### Cambiar de proveedor

`src/lib/mail.ts` concentra todo el envío. Cualquier proveedor SMTP (Brevo,
Mailgun, Postmark, o el Workspace si algún día se destraba la política) se
configura con las mismas variables, **sin tocar una línea de código**. Y si
algún día se monta n8n, se reemplaza el cuerpo de `notificarContacto()` por un
`fetch` al webhook y ni el endpoint ni el formulario se enteran.

---

## Límite de rate del formulario de contacto

`/api/contacto` limita a 5 mensajes por IP por hora usando un `Map` en memoria.
**En serverless eso es best-effort**: cada instancia tiene su propio `Map` y las
instancias se reciclan. Ya estaba documentado en el propio endpoint.

Las barreras que sí funcionan son el honeypot, la verificación MX del dominio
del remitente y el antispam de Gmail del lado receptor. Si el spam llega a ser
un problema real, la solución es un store externo (Vercel KV / Upstash) — no
tocar el `Map`.

---

## Pendientes antes de considerar el sitio publicado

- [ ] Cargar `SITE_URL=https://gardenlaunion.cl` en Vercel (Production).
- [ ] Cargar las variables SMTP, correr `node scripts/probar-smtp.js` y después
      enviar un mensaje real desde el formulario. Es lo único que puede fallar
      sin que se note en el build — ver "Formulario de contacto" más arriba.
- [ ] Conectar el dominio y verificar que `www` redirige al apex.
- [ ] Los pasos de SEO posteriores al deploy están en [`SEO.md`](./SEO.md)
      (Search Console, sitemap, validación de datos estructurados).

---

## Ver también

- [SEO.md](./SEO.md) — qué metadatos emite el sitio y cómo verificarlos.
- [CONTENIDO.md](./CONTENIDO.md) — dónde se edita cada texto y foto.
- [SETUP_DEV.md](./SETUP_DEV.md) — entorno local.
