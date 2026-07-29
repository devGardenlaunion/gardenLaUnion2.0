# Red-Team — Garden College Web

> Documento de trabajo. Contexto de un ejercicio de seguridad ofensiva sobre el
> propio proyecto. Objetivo: atacar desde varios ángulos y cerrar cada brecha,
> iteración por iteración, hasta cumplir los criterios de abajo.
>
> **Superficie:** sitio estático en Vercel (deploy por commit) + una sola API
> (`POST /api/contacto`) + formulario público. Sin login, sin base de datos,
> sin datos de menores. El activo a proteger es: el dominio/reputación de correo,
> la disponibilidad de la función serverless, y la integridad de lo que le llega
> al colegio.

## Criterios de salida (el loop termina cuando TODOS se cumplen)

- [x] **C1 — Cabeceras.** CSP presente y restrictiva + las ya existentes. Sin
  `unsafe-eval`. `frame-ancestors` cerrado. → probado A1.
- [x] **C2 — Inyección de correo.** Ningún campo del formulario puede inyectar
  cabeceras SMTP ni falsificar el bloque estructurado que lee el triage.
- [~] **C3 — Relay/spam.** Rate-limit ya no evadible por spoofing (A2). Residual:
  el acuse a dirección arbitraria es inherente; mitigado (corto/sin links/
  Auto-Submitted) + documentado. Fix duro = store KV si aparece abuso.
- [x] **C4 — DoS/recursos.** Payload 413 antes de parsear (A3). Map con techo.
  Sin ReDoS (regex lineales, Levenshtein acotado). DNS con forma+timeout (A5).
- [x] **C5 — Secretos.** Sin secretos reales en repo/bundle/history. Los
  `DB_PASSWORD=cualquier_cosa` del history son placeholders de la era Docker
  retirada. `.env*` nunca trackeado. **+ dep audit prod = 0 vulns** (sharp y
  postcss bumpeados por CVE; ver it.2).
- [x] **C6 — Identidad/IP.** IP de rate-limit/forense no falsificable (A2).
- [x] **C7 — Cliente.** Sin XSS (no hay input→HTML), sin tabnabbing (noopener),
  `?doc=` lista blanca, y redirect www→apex sin open-redirect (A7: el host
  siempre queda fijo, el input sólo controla el path). CSRF de form simple
  bloqueado por el parseo JSON (A8).
- [x] **C8 — Privacidad.** IP/geo señalado para revisión legal (Ley 19.628) en
  ContactForm, DEPLOY_VERCEL.md y acá. No es bug; es cumplimiento a validar
  con abogado antes de publicar (transferencia a terceros si entra IA de triage).

## Ángulos de ataque considerados

1. API de contacto (inyección de cabeceras, relay, DoS, parser confusion, ReDoS)
2. Cabeceras de seguridad / clickjacking / MIME sniffing
3. Secretos y configuración
4. Endpoints estáticos (robots, sitemap, redirect www→apex → open redirect)
5. Página de documentos (`?doc=`, iframe PDF)
6. Cliente React (XSS, tabnabbing, inyección en dangerouslySetInnerHTML)
7. Rate-limit / identidad de IP (spoofing de x-forwarded-for)
8. Privacidad / PII

---

## Estado por hallazgo

Severidad: 🔴 alta · 🟠 media · 🟡 baja · ✅ ya resuelto (sesiones previas)

| # | Área | Hallazgo | Sev | Estado |
|---|------|----------|-----|--------|
| H1 | Cabeceras | Falta `Content-Security-Policy` (y COOP). Único freno a XSS/clickjacking hoy es X-Frame-Options. | 🔴 | it.1 |
| H2 | Rate-limit/IP | `getClientIp` toma el 1er token de `x-forwarded-for`, que el cliente puede anteponer → evade rate-limit y envenena el log forense. | 🔴 | it.1 |
| H3 | DoS | `req.json()` parsea el body sin chequear `Content-Length` antes. | 🟠 | it.1 |
| H4 | DNS | `dominioRecibeCorreo` hace `resolveMx` de un dominio arbitrario sin validar forma → amplifica y sostiene la función hasta 3s por request. | 🟠 | it.1 |
| H5 | Relay/spam | El acuse manda texto del atacante (nombre + extracto 200c) a CUALQUIER email, desde el dominio del colegio. Rate-limit best-effort es el único freno. | 🟠 | it.1 |
| C2 | Inyección correo | Header injection (name/subject) y bloque JSON falsificable. | ✅ | resuelto (saneo + delimitador con id) |
| — | Honeypot | Respuesta del honeypot delataba el filtro. | ✅ | resuelto (id falso) |
| — | Rate-limit mem | Map sin techo. | ✅ | resuelto (limpiarRateLimit) |
| — | Secretos | `.env.bak` no ignorado. | ✅ | resuelto (`.env.*`) |
| — | Cliente | target=_blank, dangerouslySetInnerHTML, ?doc=. | ✅ | verificado seguro |

---

## Bitácora de iteraciones

### Iteración 1 — CERRADA ✅
Objetivo: C1, C6, C4. Fixes H1–H5.

**Cambios:**
- H1 `next.config.js`: CSP estricta (todo 'self', `object-src none`, `base-uri
  self`, `frame-ancestors self`, `form-action self`) + `Cross-Origin-Opener-Policy`.
  `'unsafe-inline'` sólo en script/style (inevitable sin nonce; sitio 100% estático).
- H2 `route.ts` `getClientIp`: prioriza `x-real-ip`/`x-vercel-forwarded-for`
  (los fija Vercel); de `x-forwarded-for` usa el ÚLTIMO token, no el 1º.
- H3 `route.ts`: corta por `Content-Length > 32KB` → 413 antes de parsear.
- H4 `anti-spam.ts` `dominioTieneForma()`: valida forma del dominio antes de
  `resolveMx` → no gasta DNS en basura.
- H5 acuse: residual documentado, sin cambio de código (ya mitigado).

**Ataques ejecutados (dev server, todos PASS):**
| ID | Ataque | Esperado | Real |
|----|--------|----------|------|
| A1 | GET / → cabeceras | CSP+COOP+HSTS presentes | ✅ |
| A2 | x-real-ip en límite + XFF rotando | sigue 429 | ✅ 429×3 |
| A3 | body 40KB | 413 | ✅ |
| A5 | email `a@nodot`,`a@foo`,`a@-mal-.com` | 400 sin DNS | ✅ |
| A6 | 6 POST misma IP | 6º = 429 | ✅ |

Control: IP nueva → 201 (rate-limit no rompe tráfico legítimo). ✅

### Iteración 2 — CERRADA ✅
Objetivo: C5, C7, C8.

**Recon/hallazgos:**
- `npm audit` prod: sharp <0.35 (3 CVE high libvips) + Next + postcss anidados.
  Camino real: el proyecto acepta imágenes de terceros (HEIC/RAW) que sharp
  decodifica en build. → **bumpeado**: sharp ^0.35.3, next 16.2.6→16.2.12,
  postcss →8.5.24 vía `overrides`. **Audit prod = 0 vulns.** Restan 2 dev-only
  (babel/brace-expansion vía eslint) fuera de la superficie del sitio desplegado.
- git history: sin secretos reales (sólo placeholders Docker). `.env` nunca trackeado.

**Ataques ejecutados (PASS):**
| ID | Ataque | Esperado | Real |
|----|--------|----------|------|
| A7 | www→apex con `//evil.com`, `/@evil.com`, `%2F%2F` | host queda en gardenlaunion.cl | ✅ sin open-redirect |
| A8 | POST form-encoded/text-plain/multipart | 400 (parseo JSON falla) | ✅ ×3 |

**Verificado seguro sin cambio:** HTML de los correos escapa todos los campos de
usuario con `esc()` y ninguno va a un atributo; subject usa categoría/sede de
lista blanca + asunto saneado.

**Hallazgo NUEVO → it.3:**
- H6 🟠 `mail.ts`: `replyTo` interpola `datos.nombre` en un string. El saneo
  quita CRLF pero no `"`/`<`/`>`; un nombre `x" <evil@x.com>` puede alterar la
  estructura del header. Fix: pasar `{name, address}` estructurado a nodemailer.

### Iteración 3 — CERRADA ✅
Objetivo: H6.

**Cambio** `mail.ts`: `from`/`to`/`replyTo` con input pasan como objetos
`{name, address}` a nodemailer (codifica el nombre, valida la dirección) en vez
de interpolarse en un string.

**Ataque ejecutado (jsonTransport, sin enviar):**
- Nombre = `Atacante" <evil@attacker.com>, victima@ejemplo.com x="`
- **String viejo:** parseaba en **2 direcciones**, incl. `evil@attacker.com` →
  header injection real (la respuesta del colegio iba al atacante). ✗
- **Estructurado (nuevo):** 1 sola dirección, la real; el nombre malicioso queda
  inerte como display name. ✅

Con esto **C2 queda cerrado también para el vector de dirección** (antes sólo
cubría CRLF en subject/body).

---

## RESULTADO FINAL

**Los 8 criterios se cumplen.** C3 con residual conocido, mitigado y documentado
(no es una brecha abierta: es una propiedad inherente a "mándame confirmación",
acotada por rate-limit no evadible + acuse sin links + Auto-Submitted).

Vectores probados y cerrados: inyección de cabeceras SMTP (CRLF y dirección),
falsificación del bloque de triage, XSS (cliente y correo), clickjacking,
open-redirect, CSRF de form simple, spoofing de IP para evadir rate-limit,
DoS por payload/memoria/DNS, CVEs de dependencias (prod = 0), secretos en repo.

**Pendientes NO de seguridad (informados, decisión del dueño):**
- C8 privacidad: validar aviso Ley 19.628 con abogado antes de publicar.
- C3 escalamiento: store KV/Upstash si aparece abuso real de spam del acuse.
- Config Vercel: variables de entorno + registro SPF (`include:_spf.google.com`).
- 2 vulns dev-only (eslint) fuera de la superficie del sitio desplegado.
