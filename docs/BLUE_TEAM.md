# Revisión Blue-Team — Garden College Web

> Revisión defensiva del proyecto contra normativa vigente. Complementa el
> ejercicio ofensivo de `docs/REDTEAM.md`: donde ése buscaba romper, éste
> verifica sistemáticamente que cada control esté bien puesto.
>
> **Marcos usados:** OWASP Top 10 2021 · OWASP ASVS 5.0 · OWASP Secure Headers
> Project · RFC 9116 (security.txt) · Ley 21.719 (protección de datos, Chile).
>
> **Superficie:** sitio estático en Vercel + `POST /api/contacto` + formulario
> público. Sin login, sin BD, sin datos de menores.

## Veredicto

Controles en orden. Los fixes de esta revisión están aplicados y verificados.
Lo que queda abierto son **decisiones del colegio** (cumplimiento legal, config
de infraestructura), no defectos de código.

---

## OWASP Top 10 2021 — estado

| ID | Categoría | Estado | Nota |
|----|-----------|--------|------|
| A01 | Broken Access Control | ✅ N/A | Sin auth ni recursos privados. Único endpoint es público por diseño. No hay IDOR posible (no hay IDs de recurso). |
| A02 | Cryptographic Failures | ✅ | HSTS preload + `upgrade-insecure-requests`. Secretos sólo en env, nunca en repo/bundle. TLS lo termina Vercel. |
| A03 | Injection | ✅ | Zod valida y sanea todo input. Inyección de cabeceras SMTP cerrada (CRLF + direcciones estructuradas). Sin SQL (no hay BD). XSS: sin sinks input→HTML; correos escapan todo campo. |
| A04 | Insecure Design | ✅ | Estático-first, honeypot+time-trap, delimitador de triage con id, acuse sin links. |
| A05 | Security Misconfiguration | ✅ | CSP estricta, COOP, nosniff, X-Frame-Options, `poweredByHeader:false`, errores genéricos al cliente. |
| A06 | Vulnerable Components | ✅ | `npm audit` prod = **0**. sharp/next/postcss bumpeados por CVE. 2 dev-only (eslint) fuera de superficie. |
| A07 | Ident. & Auth Failures | ✅ N/A | Sin autenticación en el sitio. |
| A08 | Software & Data Integrity | ✅ | Deploy por commit firmado en Vercel. Sin scripts externos (CSP `script-src 'self'`). Sin deserialización insegura. |
| A09 | Logging & Monitoring | 🟡 | Se loguean fallos de correo y payloads inválidos (server-side). Sin alertas ni SIEM — aceptable a esta escala; Vercel guarda logs. |
| A10 | SSRF | ✅ | Única salida es `resolveMx` (DNS, no HTTP) con validación de forma + timeout 3s. Sin rewrites con destino controlado por el usuario. |

---

## Cabeceras de seguridad (OWASP Secure Headers Project)

Emitidas por `next.config.js → headers()` para todas las rutas:

| Cabecera | Valor | ✓ |
|----------|-------|---|
| Content-Security-Policy | `default-src 'self'` + object/base/frame-ancestors/form-action cerrados | ✅ |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| X-Frame-Options | `SAMEORIGIN` (+ CSP frame-ancestors) | ✅ |
| Cross-Origin-Opener-Policy | `same-origin` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | camera/mic/geo/payment/usb/topics deshabilitados | ✅ |
| Cache-Control (API) | `no-store` en todas las respuestas de `/api/contacto` | ✅ |
| ~~X-Powered-By~~ | **eliminado** (`poweredByHeader:false`) | ✅ |

**No se agregó `Cross-Origin-Resource-Policy: same-origin` a propósito:**
bloquearía que WhatsApp/Facebook lean la `og-image` al compartir el sitio.
`unsafe-inline` en script-src es inevitable sin nonce (el sitio es 100% estático
por requisito duro); la CSP igual cierra scripts externos, exfiltración y `<base>`.

---

## Fixes aplicados en esta revisión

1. `next.config.js`: `poweredByHeader:false` (menos fingerprinting) +
   Permissions-Policy ampliada (payment, usb, browsing-topics).
2. `route.ts`: helper `json()` con `Cache-Control: no-store` en TODA respuesta;
   error de validación devuelve mensaje genérico al cliente y el detalle va sólo
   al log del server (menos superficie de sondeo del esquema).
3. `ContactForm.tsx`: aviso de privacidad mejorado (finalidad + derecho de
   supresión) y comentario legal actualizado a Ley 21.719.
4. `public/.well-known/security.txt`: canal de reporte de vulnerabilidades
   (RFC 9116), apuntando al correo del colegio, con `Expires`.

**Verificado (dev server):** X-Powered-By ausente · API `no-store` presente ·
error sin `detalles` · Permissions-Policy con `browsing-topics=()` ·
security.txt 200.

---

## Cumplimiento — Ley 21.719 (protección de datos, Chile)

> La Ley 21.719 (publicada dic-2024, en vigencia ~dic-2026) moderniza la 19.628,
> crea la Agencia de Protección de Datos y sube el estándar a algo tipo-GDPR.
> El formulario trata datos personales: nombre, email, teléfono, mensaje **e IP
> + ubicación aproximada** (estos dos también son dato personal).

Estado: el aviso cubre **finalidad** y **tipo de dato**, que es el mínimo. Lo que
falta NO es código, es **definición del colegio** (idealmente con abogado):

- [ ] **Responsable del tratamiento** identificado (Corporación Educacional
      Filadelfia Garden) con un contacto para ejercer derechos.
- [ ] **Base de licitud** del tratamiento (consentimiento / interés legítimo).
- [ ] **Plazo de retención** de los correos y logs con IP. Hoy no hay política:
      los mails quedan en la casilla indefinidamente.
- [ ] **Política de privacidad enlazable** con derechos de acceso, rectificación,
      supresión y oposición. Hoy sólo hay un párrafo bajo el formulario.
- [ ] Si entra **IA de triage** que mande el contenido a un tercero (OpenAI,
      Anthropic, etc.): es transferencia a un tercero — requiere base legal y
      mención expresa. Ya señalado en REDTEAM.md y CLAUDE.md.

---

## Pendientes de infraestructura (no de código)

- Variables de entorno en Vercel (Production + Preview).
- Registro **SPF** del dominio: `v=spf1 include:_spf.google.com ~all` (hoy el
  TXT está vacío → correo falsificable desde @gardenlaunion.cl). Idealmente DKIM
  + DMARC también.
- Refrescar `security.txt` antes de `Expires` (2027-07-29).
