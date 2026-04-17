# Panel Admin — Garden College · TODO

> Estado: sin implementar. La web pública ya está funcionando con datos desde BD.
> El panel es el paso siguiente para que el colegio gestione el contenido sin tocar código.

---

## Autenticación

- [ ] Configurar NextAuth con Google OAuth 2.0
  - Variables requeridas: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - Restringir login a emails autorizados (lista en `.env` o tabla `AdminUser` en BD)
- [ ] Middleware que protege `/admin/**` — redirige a `/admin/login` si no hay sesión
- [ ] Página `/admin/login` — botón "Continuar con Google"
- [ ] Página `/admin/logout`

---

## Dashboard `/admin`

- [ ] Resumen de contenido: N noticias publicadas, N eventos, N mensajes sin leer
- [ ] Accesos rápidos a cada sección
- [ ] Estado del sitio: última actualización de config, última noticia publicada

---

## Noticias `/admin/noticias`

- [ ] Listado con paginación: título, estado (BORRADOR / PUBLICADA), fecha, acciones
- [ ] Crear noticia: título, slug (auto desde título, editable), extracto, contenido (editor WYSIWYG), imagen portada, estado
- [ ] Editar noticia existente
- [ ] Eliminar noticia (con confirmación)
- [ ] Publicar / despublicar desde el listado (toggle rápido)
- [ ] Editor WYSIWYG: usar `@tiptap/react` (tiene build ARM64, sin dependencias nativas)
- [ ] Sanitizar HTML antes de guardar en BD (`isomorphic-dompurify`)
- [ ] Subir imagen portada → guardar en `public/uploads/{año}/{mes}/` → devolver URL

---

## Eventos `/admin/eventos`

- [ ] Listado de eventos (tipo recurrente): Acto de Premiación, Semana Adventista, etc.
- [ ] Crear / editar evento base (nombre, slug, recurrencia, activo)
- [ ] **Ediciones por evento**: cada año es una edición
  - Campos: título, slug, extracto, contenido, imagen portada, fecha, estado, destacada
  - Subir multimedia: fotos (tipo `foto`) y links de YouTube (tipo `youtube`)
  - Orden de multimedia (drag & drop o campos de orden numérico)
- [ ] Marcar edición como "destacada" (aparece como hero en la home)
- [ ] Publicar / despublicar edición

---

## Galería `/admin/galeria`

- [ ] Listado de álbumes
- [ ] Crear / editar álbum: nombre, descripción, fecha, portada, activo
- [ ] Subir fotos a un álbum (multiple upload)
- [ ] Reordenar fotos dentro del álbum
- [ ] Eliminar foto con confirmación
- [ ] Las fotos se sirven desde `public/uploads/` (dev) o Object Storage (prod)

---

## Configuración institucional `/admin/institucional`

Edición de las claves `ConfigSitio` agrupadas por sección:

- [ ] **Institucional**: nombre del colegio, slogan, misión, visión, reseña
- [ ] **Sellos educativos**: título y descripción de cada sello (Vida Saludable, Inglés, Cristiana)
- [ ] **Convivencia**: título, descripción, logros (editor de lista)
- [ ] **Contacto**: sedes (nombre, dirección, teléfono, niveles), email general
- [ ] **Redes sociales**: Facebook, Instagram, YouTube
- [ ] **Admisión**: texto informativo, link al SAE del Mineduc
- [ ] **Eventos**: título sección, subtítulo, badge
- [ ] **Noticias**: título sección, subtítulo, badge
- [ ] Subir logo del colegio (reemplaza `/media/Logo/cropped-cropped-logo.png`)
- [ ] Invalidar cache ISR al guardar (llamar a `revalidatePath("/")`)

---

## Mensajes de contacto `/admin/mensajes`

- [ ] Listado: nombre, email, asunto, fecha, leído/no leído
- [ ] Ver detalle del mensaje
- [ ] Marcar como leído
- [ ] Eliminar (con confirmación)
- [ ] Badge en sidebar con N mensajes no leídos

---

## Subida de archivos (infraestructura transversal)

- [ ] API route `POST /api/admin/upload` — requiere auth, acepta multipart/form-data
- [ ] Validar tipo (jpg, png, webp) y tamaño (máx 5 MB)
- [ ] Generar thumbnail con `sharp` (400px ancho, mantiene ratio)
- [ ] Guardar en `public/uploads/{año}/{mes}/{uuid}.webp`
- [ ] Devolver `{ url, thumbnailUrl }`
- [ ] En prod: migrar destino a Oracle Object Storage (mantener misma interfaz de API)

---

## Sidebar / Layout del panel

- [ ] Layout compartido para todas las rutas `/admin/**`
- [ ] Sidebar con links: Dashboard, Noticias, Eventos, Galería, Institucional, Mensajes
- [ ] Header con nombre del usuario logueado y botón cerrar sesión
- [ ] Responsive: sidebar colapsable en móvil
- [ ] Indicador de sección activa

---

## Seguridad y hardening

- [ ] Todas las API routes del panel verifican sesión con `getServerSession`
- [ ] Rate limiting en `POST /api/contacto` (5 req/hora por IP) — usar `@upstash/ratelimit` o solución sin Redis
- [ ] CORS: solo aceptar origen del dominio del colegio en las API routes públicas
- [ ] Headers de seguridad en `next.config.js`: CSP, X-Frame-Options, HSTS
- [ ] Logs de acciones admin: quién publicó qué y cuándo (tabla `AuditLog` en BD)

---

## Notas de implementación

- Stack ya definido: Next.js 14 App Router, Prisma, PostgreSQL, TailwindCSS, NextAuth
- NO usar component libraries externas (MUI, Chakra) — componentes propios con Tailwind
- NO usar `moment.js` — `date-fns` ya está instalado
- Imágenes: `sharp` ya tiene build ARM64, no cambiar
- Deploy: Docker en Oracle Cloud ARM64 — todo debe funcionar en `linux/arm64`
- Editor WYSIWYG recomendado: `@tiptap/react` + extensiones básicas (negrita, cursiva, listas, links, imagen)
- Alternativa más simple si Tiptap parece excesivo: `react-quill-new` (fork de Quill con soporte React 18)
