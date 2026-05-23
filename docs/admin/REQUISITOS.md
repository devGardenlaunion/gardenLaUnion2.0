# Panel Admin — Requisitos de Implementación

> Checklist completo. Leer [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) antes de
> implementar la sección de Eventos. Leer [GALERIAS.md](./GALERIAS.md) antes de
> implementar subida de multimedia.

---

## Hardcodeo pendiente de eliminar

Antes de implementar el admin, hay datos que están hardcodeados en código y deben migrar a BD o ConfigSitio:

### `src/data/redes.ts` — eliminar el archivo completo
Las URLs de redes sociales están en este archivo Y en `ConfigSitio`.
La página `(public)/page.tsx` ya lee de ConfigSitio pero importa de `redes.ts` en algunas rutas.
**Acción:** Eliminar `redes.ts`. Asegurar que todas las rutas lean de ConfigSitio.

```
instagram: 'https://www.instagram.com/garden.launion'       ← mover a ConfigSitio
facebook:  'https://www.facebook.com/...'                   ← mover a ConfigSitio
youtube:   'https://www.youtube.com/@Garden.launion'        ← mover a ConfigSitio
whatsapp:  'PLACEHOLDER_WHATSAPP_URL'                       ← agregar a ConfigSitio
```

### `src/data/recursos.ts` — migrar a ConfigSitio o tabla propia
Documentos y links externos hardcodeados, incluyendo el ID específico del colegio en el SAE:
```
url: 'https://admision.mineduc.cl/vitrina-vue/establecimiento/22743'
```
El número `22743` es el ID del colegio en el sistema Mineduc — hardcodeado en código.
**Acción:** Mover estos items a una tabla `RecursoExterno` en BD o a ConfigSitio bajo grupo "recursos".
Permitir al admin agregar/editar/eliminar recursos externos desde el panel.

### `src/app/eventos/[slug]/page.tsx` — textos UI hardcodeados
Strings en la UI que deberían venir de ConfigSitio:
```
"Galería"              ← heading de la sección galería de la edición
"Volver a Eventos"     ← link de navegación
"Ediciones anteriores" ← label de la sección de links a años previos
title: `${edicion.titulo} — Garden College`  ← "Garden College" hardcodeado
```
Los strings de navegación ("Volver a", "Ediciones anteriores") son menos críticos — están en español
y son genéricos. El título de metadata sí debería usar `config["institucional.nombre"]`.

### `src/app/eventos/[slug]/page.tsx` — inconsistencia Evento.descripcion vs Edicion.contenido
**Issue crítico de arquitectura:** La página actualmente renderiza `Evento.descripcion`
(campo del evento padre, compartido entre todas las ediciones) como texto narrativo de la
subpágina, ignorando `Edicion.contenido` (campo específico de la edición que el admin debe editar).

**Acción requerida al implementar el admin:**
1. Usar `Edicion.contenido` como el cuerpo de texto de la subpágina (renderizar como HTML sanitizado)
2. El editor WYSIWYG del admin debe apuntar a `Edicion.contenido`
3. `Evento.descripcion` se conserva en BD como referencia pero no se muestra en la web

---

## Migración requerida — antes de implementar subida de imágenes

Agregar dimensiones a `Multimedia` para que `GaleriaColumnas` funcione sin Sharp on-the-fly:

```prisma
model Multimedia {
  // campos existentes ...
  ancho  Int?   // ancho px de la imagen procesada (null para youtube)
  alto   Int?   // alto px de la imagen procesada (null para youtube)
}
```

```bash
npx prisma migrate dev --name add_multimedia_dimensions
```

---

## Autenticación

- [ ] NextAuth con Google OAuth 2.0
  - Variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - Restringir a emails autorizados (env `ALLOWED_EMAIL_DOMAIN` o tabla `User` con `active: true`)
- [ ] Middleware que protege `/admin/**` → redirige a `/admin/login` si no hay sesión
- [ ] Página `/admin/login` — botón "Continuar con Google"
- [ ] Página `/admin/logout`

---

## Layout / Sidebar

- [ ] Layout compartido para todas las rutas `/admin/**`
- [ ] Sidebar: Dashboard · Noticias · Eventos · Galería · Institucional · Mensajes
- [ ] Header con nombre del usuario logueado y botón cerrar sesión
- [ ] Responsive: sidebar colapsable en móvil (hamburger)
- [ ] Indicador de sección activa en el sidebar
- [ ] Badge en sidebar con N mensajes no leídos

---

## Dashboard `/admin`

- [ ] Contador: N noticias publicadas, N eventos activos, N mensajes sin leer
- [ ] Accesos rápidos a cada sección
- [ ] Estado del sitio: última actualización de config, última noticia publicada

---

## Eventos `/admin/eventos`

> Ver [BLUEPRINT_EVENTOS.md](./BLUEPRINT_EVENTOS.md) para el detalle completo.
> El modelo tiene dos niveles separados: el Evento (permanente) y la Galería Anual.

### Gestión del Evento (texto permanente)
- [ ] Listado de eventos: nombre, slug, galería activa, activo/inactivo
- [ ] Crear evento: nombre, slug (auto-generado, editable), activo
- [ ] **Editar evento** (se hace raramente — una vez al crear, raramente después):
  - Extracto (texto del blockquote destacado)
  - **Contenido** — editor WYSIWYG (Tiptap recomendado) → `Evento.contenido`
  - Imagen portada del hero (single upload, si no hay video permanente)
  - Estado (PUBLICADO / BORRADOR)
- [ ] El GaleriaPolaroid **no se gestiona desde el admin** — se actualiza reemplazando
  archivos en `public/media/eventos/[slug]/polaroid/` (acción del desarrollador)

### Gestión de la Galería Anual
- [ ] Listado de galerías por evento: año, N fotos, N videos, estado, activa/historial
- [ ] **Crear galería anual:**
  - Solo el **año** (campo entero: `2026`, `2027`…) — sin mes, sin día
  - Estado (BORRADOR / PUBLICADA)
- [ ] Al publicar una nueva galería → marcar como `activa: true`, la anterior pasa a `activa: false`
- [ ] Galerías anteriores quedan en BD con `activa: false` — conservadas pero sin acceso público por ahora
- [ ] Historial de galerías pasadas: **pendiente de decidir formato** (lista de años, descargable, página de historial)

### Subida de multimedia de la galería anual
- [ ] Upload múltiple de fotos → pipeline Sharp → guardar en `Multimedia` con `ancho` y `alto`
- [ ] Upload de videos → auto-generar thumbnail con ffmpeg → guardar en `Multimedia`
- [ ] Reordenar multimedia (drag & drop o campo orden numérico)
- [ ] Eliminar foto/video con confirmación
- [ ] Agregar link de YouTube → `Multimedia` con `tipo: "youtube"`

### Migración requerida del schema
El schema actual usa `Edicion` (con título, contenido, fecha, slug por año) — modelo anterior.
El modelo objetivo separa el texto del evento (permanente) de la galería anual.
Decidir y ejecutar esta migración antes de implementar el admin de eventos.

---

## Noticias `/admin/noticias`

- [ ] Listado con paginación: título, estado, fecha, acciones
- [ ] Crear noticia: título, slug (auto desde título, editable), extracto, contenido WYSIWYG, imagen portada, estado
- [ ] Editar noticia existente
- [ ] Eliminar con confirmación
- [ ] Toggle publicar/despublicar desde el listado
- [ ] Editor WYSIWYG: `@tiptap/react` (tiene build ARM64)
- [ ] Sanitizar HTML antes de guardar (`isomorphic-dompurify`)
- [ ] Subir imagen portada → pipeline → guardar URL en BD

---

## Galería General `/admin/galeria`

- [ ] Listado de álbumes: título, N fotos, fecha, visible/oculto
- [ ] Crear / editar álbum: nombre, descripción, fecha, portada, visible
- [ ] Subir fotos a un álbum (multiple upload) → pipeline de imágenes
- [ ] Reordenar fotos dentro del álbum
- [ ] Eliminar foto con confirmación

---

## Configuración Institucional `/admin/institucional`

Edición de claves `ConfigSitio` agrupadas por sección:

- [ ] **Institucional:** nombre del colegio, slogan, misión, visión, reseña, corporación
- [ ] **Sellos educativos:** título y descripción de cada sello (Vida Saludable, Inglés, Formación Cristiana)
- [ ] **Convivencia:** título, descripción, logros (lista editable), pilares, testimonio
  - Ver [CONVIVENCIA.md](docs/admin/CONVIVENCIA.md) para guía editorial
- [ ] **Contacto:** sedes (nombre, dirección, teléfono, niveles por sede), email general
- [ ] **Redes sociales:** Instagram, Facebook, YouTube, WhatsApp
- [ ] **Admisión:** texto informativo, link al SAE del Mineduc
- [ ] **Recursos externos:** lista editable (reemplaza `src/data/recursos.ts`)
- [ ] **Eventos:** título de sección, subtítulo, badge
- [ ] **Noticias:** título de sección, subtítulo
- [ ] Subir logo del colegio (reemplaza `/media/Logo/cropped-cropped-logo.png`)
- [ ] Invalidar cache ISR al guardar: `revalidatePath("/")`

---

## Mensajes de Contacto `/admin/mensajes`

- [ ] Listado: nombre, email, asunto, fecha, leído/no leído
- [ ] Ver detalle del mensaje
- [ ] Marcar como leído / no leído
- [ ] Eliminar con confirmación

---

## Subida de archivos (infraestructura transversal)

- [ ] API route `POST /api/admin/upload` — requiere auth, acepta `multipart/form-data`
- [ ] Validar tipo MIME: `image/jpeg`, `image/png`, `image/webp`
- [ ] Validar tamaño: máx 10 MB antes de procesar
- [ ] Pipeline Sharp → guardar en `public/uploads/{año}/{mes}/{uuid}.webp`
- [ ] Thumbnail → `public/uploads/{año}/{mes}/{uuid}_thumb.webp`
- [ ] Devolver `{ url, thumbnailUrl, ancho, alto }` con dimensiones reales
- [ ] En prod: migrar destino a Oracle Object Storage (misma interfaz de respuesta)

### UX del uploader de fotos
- [ ] Drag & drop + click para seleccionar
- [ ] Preview antes de confirmar
- [ ] Mostrar dimensiones y ratio del resultado tras procesar
- [ ] Advertencia (no error) si proporción es extrema (ratio < 0.4 o > 3.0)
- [ ] Multiple upload para galerías de eventos

### Videos
- [ ] Al subir `.mp4`/`.mov`, auto-generar thumbnail con ffmpeg (fotograma al segundo 1)
- [ ] Comprimir video con ffmpeg (target < 5 MB): `crf 28`, `scale=1280:-2`, `preset slow`
- [ ] Validar tipos aceptados: `.mp4`, `.webm` (`.mov` solo en dev)
- [ ] Tamaño máximo antes de comprimir: 200 MB

---

## Editor WYSIWYG

**Recomendado:** `@tiptap/react` + extensiones básicas.
- Bold, italic, lists, links, headings (H2, H3)
- **NO** incluir imágenes inline — las imágenes van en la galería, no en el texto
- Sanitizar HTML con `isomorphic-dompurify` antes de guardar en BD

**Alternativa más simple si Tiptap parece excesivo:** `react-quill-new` (fork de Quill con React 18).

---

## Seguridad

- [ ] Todas las API routes del panel verifican sesión con `getServerSession`
- [ ] Rate limiting en `POST /api/contacto` (5 req/hora por IP)
- [ ] CORS: solo aceptar origen del dominio del colegio en API routes públicas
- [ ] Headers de seguridad en `next.config.js`: CSP, X-Frame-Options, HSTS
- [ ] Logs de acciones admin: quién publicó qué y cuándo (tabla `AuditLog` en BD)

---

## Notas de implementación

- Stack: Next.js App Router, Prisma, PostgreSQL, TailwindCSS, NextAuth — ya instalados
- NO usar component libraries (MUI, Chakra) — componentes propios con Tailwind
- NO usar `moment.js` — `date-fns` ya instalado
- `sharp` ya tiene build ARM64 — no cambiar
- Deploy: Docker en Oracle Cloud ARM64 — todo debe funcionar en `linux/arm64`
- `uuid` para nombres de archivo: `npm install uuid && npm install -D @types/uuid`
- La función `processImageUpload` va en `src/lib/storage.ts` (el archivo ya existe)
