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

## Traspaso a otra cuenta de Vercel

> Para cuando el repo pasa a la cuenta dedicada del colegio (u otra máquina). El
> **código** viaja completo en git; lo que **no** viaja son los valores secretos
> —viven en las Environment Variables de Vercel, no en el repo— y el dominio.
> Esos hay que rehacerlos en la cuenta nueva.

Orden de los pasos (cada uno detallado en su sección de este mismo documento):

1. **Importar el repo** en la cuenta de Vercel nueva: *Add New → Project →* elegir
   el repositorio. No hay que tocar el preset ni los comandos — ver
   [Configuración del proyecto](#configuración-del-proyecto-en-vercel).
2. **Cargar las variables de entorno** en *Settings → Environment Variables*.
   Ninguna está en el repo; se cargan a mano desde [`.env.example`](../.env.example):
   - `SITE_URL` → **solo Production**.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACTO_FROM`,
     `CONTACTO_FROM_NAME`, `CONTACTO_TO` → Production y Preview.
   - La `SMTP_PASS` es la **contraseña de aplicación** de `web@gardenlaunion.cl`,
     que **no** está en git. Si no la tenés a mano, se genera de nuevo — ver
     [Configuración inicial del correo](#configuración-inicial).
3. **Conectar el dominio** `gardenlaunion.cl` + `www` y apuntar el DNS a la cuenta
   nueva — ver [Dominio](#dominio). El DNS del registrador pasa a apuntar a **este**
   proyecto; el dominio no puede estar activo en dos proyectos de Vercel a la vez.
4. **Revisar el DNS de correo** (SPF/DKIM) del dominio: si el registrador cambió,
   el `include:_spf.google.com` (o los registros de Resend) tienen que seguir
   ahí, o el acuse del formulario empieza a caer en spam.
5. **Verificar** antes de dar por publicado: correr `git push` a `main` para
   forzar un build limpio en la cuenta nueva, `node scripts/probar-smtp.js` para
   el correo, y después un envío real del formulario. El checklist completo está
   en [Pendientes antes de considerar el sitio publicado](#pendientes-antes-de-considerar-el-sitio-publicado).

Lo que **no** hay que hacer: no hay base de datos que migrar, ni backups que
mover, ni estado que exportar. El contenido y las fotos están en git; con el repo
importado y las variables cargadas, el sitio queda idéntico.

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

### Proveedor: Google Workspace (`web@gardenlaunion.cl`)

El envío sale por el SMTP del Workspace del colegio, autenticado con una
**contraseña de aplicación** de la casilla `web@gardenlaunion.cl`.

Historial, porque la decisión cambió y conviene que quede escrito: al principio
la política de la organización bloqueaba las contraseñas de aplicación y se
montó **Resend** como alternativa. Cuando se habilitó la contraseña para esa
casilla, se volvió a Workspace: es una pieza menos que mantener, sin cuenta de
terceros ni verificación DNS propia. La config de Resend queda documentada más
abajo como plan B, y sigue siendo la opción correcta si algún día hay que sacar
la credencial de Google de Vercel.

> ### La contraseña de aplicación NO es equivalente a una API key
>
> Da acceso **completo a la casilla** — envío y lectura por IMAP —, no sólo
> envío. Por eso `web@gardenlaunion.cl` tiene que ser una cuenta **dedicada al
> sitio**: sin correo real del colegio y sin nada que toque datos de estudiantes.
>
> Si esa casilla alguna vez pasa a usarse de verdad, hay que volver a Resend: su
> API key es sólo-envío y se revoca sin tocar la cuenta de Google.
>
> Si la contraseña se filtra: *Cuenta de Google → Seguridad → Contraseñas de
> aplicación → Revocar*, generar otra y actualizarla en Vercel.

### Configuración inicial

1. En la cuenta `web@gardenlaunion.cl`: verificación en 2 pasos activada, y
   generar la contraseña en <https://myaccount.google.com/apppasswords>.
   Se muestra una sola vez, en grupos de 4 (`abcd efgh ijkl mnop`).
2. **Pegarla sin espacios** (`abcdefghijklmnop`, 16 caracteres). Google los
   ignora, pero al copiar el valor a Vercel los espacios sí pueden viajar y
   romper la autenticación.
3. **SPF**: el dominio necesita `include:_spf.google.com` en su registro TXT.
   Sin eso el correo sale, pero llega marcado como sospechoso.
   **No puede haber dos registros TXT de SPF** en el dominio: si ya existe uno
   (de Resend, del hosting anterior), se agrega el `include` al que está, no se
   crea otro.
4. Completar en `.env` (local) y en Vercel (producción):

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=web@gardenlaunion.cl
   SMTP_PASS=<contraseña de aplicación, 16 caracteres sin espacios>
   CONTACTO_FROM=web@gardenlaunion.cl
   CONTACTO_FROM_NAME=Garden College Web
   CONTACTO_TO=<dónde llegan los avisos>
   ```

`CONTACTO_FROM` **tiene que ser la misma casilla que `SMTP_USER`**: Gmail
reescribe el `From` con la cuenta autenticada, así que poner otra dirección no
cambia lo que ve el apoderado, sólo agrega un `Sender:` raro en la cabecera.

`CONTACTO_TO` puede ser distinta de `contacto.email` en
`src/content/config.ts`: la del contenido es la que **ve** el apoderado en la
web; `CONTACTO_TO` es dónde caen los avisos internos.

Límite del Workspace: ~2.000 destinatarios por día. El formulario del colegio no
se acerca ni de lejos.

### Plan B: Resend

Si hay que sacar la credencial de Google de Vercel, o la entregabilidad desde las
funciones serverless da problemas:

1. Crear cuenta en <https://resend.com> (3.000 correos/mes gratis).
2. *Domains* → *Add Domain* → `gardenlaunion.cl`, y cargar los registros DNS
   (SPF, DKIM, DMARC) que entrega. Propagan en minutos a algunas horas.
3. *API Keys* → *Create*, sólo con permiso de envío. Se muestra una sola vez.
4. En `.env` / Vercel: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`,
   `SMTP_USER=resend`, `SMTP_PASS=<la API key, empieza con re_>`. El resto de
   las variables no cambia.

> **Con Resend, `SMTP_USER` NO es el remitente**: es **la palabra literal
> `resend`**, el nombre de usuario del servidor SMTP. La dirección del remitente
> sale de `CONTACTO_FROM`, y por eso son variables separadas en `src/lib/mail.ts`.
> Si se vuelven a mezclar, el correo sale con `From: resend` y se rechaza.
>
> Mientras el dominio no esté verificado, Resend sólo deja enviar desde
> `onboarding@resend.dev` y **únicamente al correo con el que se creó la cuenta**:
> sirve para probar la API key, no para una prueba real del formulario.

### Verificar

```bash
node scripts/probar-smtp.js
```

Envía un correo real a `CONTACTO_TO` y separa dos problemas que desde el
navegador se ven idénticos: credenciales mal puestas vs. bug en el formulario.
Detecta los errores típicos (contraseña que no es de aplicación, espacios sin
sacar, API key inválida, dominio sin verificar, puerto bloqueado) y los explica
en la salida.

Después, probar el formulario en el navegador de punta a punta. Ojo con el
antispam propio: **un envío en menos de 3 segundos se descarta como bot** y
responde `201 ok` sin mandar nada (a propósito: devolver error le enseña al bot
qué evitar). Al probar, llenar el formulario con calma.

### Cómo llega el correo

Cada envío genera **dos** correos:

**1. Aviso al colegio** (`CONTACTO_TO`). El `Reply-To` es el email del apoderado:
al apretar "Responder" se le contesta directo a la persona. El asunto va con la
categoría y la sede al frente — `[admision][media] Consulta por…` — y el cuerpo
incluye un bloque de metadata (IP, ubicación aproximada, navegador, referer) por
si alguna vez hay que reportar un abuso.

**2. Acuse de recibo al apoderado.** Confirma la recepción y le deja el N° de
solicitud. Es corto a propósito: lleva un **extracto recortado** del mensaje
(200 caracteres, cortado en límite de palabra), no el mensaje completo ni un
resumen redactado. Si falla, no rompe nada: el aviso al colegio ya salió.

#### Por qué el acuse es así y no de otra forma

| Decisión | Motivo |
|---|---|
| Extracto, no mensaje completo, y sin convertir URLs en enlaces | El formulario es público: cualquiera puede poner el correo de un tercero y texto arbitrario, y el acuse se lo entregaría desde un dominio con buena reputación. Mandando poco y sin enlaces, deja de servir para hacerle llegar un mensaje a alguien. |
| Extracto **extraído**, nunca generado por IA | Sale automáticamente, sin que nadie lo lea. Un resumen redactado por un modelo es contenido publicado sin aprobación humana (regla no negociable #2) y encima expuesto a que el propio mensaje traiga instrucciones. |
| `Reply-To` a `CONTACTO_TO` | Si el apoderado responde el acuse —lo va a hacer— tiene que caer donde alguien lee, no en la casilla técnica que autentica el SMTP. |
| `Auto-Submitted: auto-generated` (RFC 3834) | Evita que dispare la respuesta automática del otro lado y se arme un ciclo. |
| Sin `Importance: high` ni `X-Priority` | **Gmail los ignora**: su marcador "Importante" lo decide el receptor, no el emisor. En correo automático sólo ayuda a caer en Promociones o spam. Para destacar, la vía real es un filtro del lado del colegio sobre `X-GC-Categoria`. |
| No se manda si el remitente es del propio dominio | Iría a una casilla del colegio y puede realimentarse. El mensaje se procesa igual; sólo se omite el acuse. |

#### Cabeceras para filtrar y para el triage

El aviso interno lleva estas cabeceras, que hacen el correo filtrable de forma
determinista **funcione o no** cualquier procesamiento automático que se monte
después:

| Cabecera | Contenido |
|---|---|
| `X-GC-Id` | N° de solicitud, `GC-AAAAMMDD-XXXXXX` |
| `X-GC-Categoria` | id de `contacto.categorias` (`admision`, `documentos`, …) |
| `X-GC-Sede` | `basica` \| `media` |
| `X-GC-Origen` | `formulario-web` |

Además, el texto plano cierra con un bloque delimitado entre `--- GC-JSON ---` y
`--- FIN GC-JSON ---` con todos los campos ya estructurados. Quien procese el
correo lee campos en vez de reparsear prosa.

> **Si se monta triage con IA:** el campo `mensaje` es texto de un desconocido y
> es un vector de inyección de prompt. Va tratado como dato delimitado, nunca
> concatenado con las instrucciones, y el modelo clasifica y sugiere — no
> responde solo. Y ojo con la **Ley 19.628**: mandar el contenido a un proveedor
> externo es una transferencia de datos personales a un tercero, y el aviso de
> privacidad actual del formulario no la cubre. Eso hay que revisarlo con
> abogado antes, no después.

### Cambiar de proveedor

`src/lib/mail.ts` concentra todo el envío. Cualquier proveedor SMTP (Resend,
Brevo, Mailgun, Postmark) se configura con las mismas variables, **sin tocar una
línea de código**. Y si
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
