# CLAUDE.md — Garden College Web Pública + Panel Admin

## Proyecto
Web pública (onepage) y panel de administración para Garden College, La Unión, Chile.
Stack: Next.js 14+ (App Router), TypeScript, Prisma, PostgreSQL, TailwindCSS, NextAuth.
Deploy: Docker en Oracle Cloud Free Tier (ARM64/aarch64).

---

## REGLAS NO NEGOCIABLES

### 1. Seguridad
- **NUNCA** hardcodear credenciales, tokens, o secrets en código. Todo va en `.env`.
- **NUNCA** exponer datos de estudiantes, apoderados o menores de edad. Este proyecto maneja SOLO datos públicos del colegio (noticias, galería, info institucional).
- Si algún requerimiento implica procesar datos personales de menores, **RECHAZAR** y señalarlo.
- PostgreSQL NO expone puertos al exterior. Solo red interna Docker.
- Toda API del panel admin requiere autenticación (NextAuth + Google OAuth 2.0).
- Validar inputs en servidor. Nunca confiar en validación client-side.
- Sanitizar HTML de editores WYSIWYG antes de almacenar (DOMPurify o similar).
- CORS restringido al dominio del colegio.

### 2. Aprobación Humana de IA
- Si en el futuro se integra generación de contenido por IA (Etapa 3), **TODO** contenido generado DEBE pasar por flujo de aprobación antes de publicarse.
- Nunca implementar publicación automática de contenido generado por IA.

### 3. SaaS-Ready (Multi-tenant futuro)
- **NUNCA** hardcodear datos específicos de Garden College en lógica de negocio o componentes.
- Usar `ConfigSitio` (key-value en BD) para: nombre del colegio, misión, visión, teléfonos, colores, logo, etc.
- Los componentes reciben datos por props o fetch, nunca tienen strings del colegio escritos directamente.
- Excepción: seed de datos iniciales (`prisma/seed.ts`) SÍ tiene datos de Garden College.

### 4. Docker-First
- Todo cambio debe funcionar dentro del container Docker.
- Imágenes deben ser **compatibles con ARM64** (Oracle Cloud usa Ampere A1).
- `docker-compose.yml` es la fuente de verdad para el deploy.
- Si una dependencia no tiene build ARM64, buscar alternativa o documentar.

---

## ARQUITECTURA

```
garden-web/
├── CLAUDE.md                    # Este archivo
├── docker-compose.yml           # Orquestación: app + db + nginx
├── docker-compose.dev.yml       # Override para desarrollo local
├── Dockerfile                   # Multi-stage, ARM64 compatible
├── nginx/
│   ├── nginx.conf               # Producción
│   └── nginx.dev.conf           # Desarrollo
├── prisma/
│   ├── schema.prisma            # Modelo de datos
│   ├── seed.ts                  # Datos iniciales Garden College
│   └── migrations/              # Migraciones versionadas
├── src/
│   ├── app/
│   │   ├── (public)/            # Onepage pública (SSR)
│   │   ├── (admin)/             # Panel admin (auth required)
│   │   ├── api/                 # API routes
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Tailwind + variables CSS
│   ├── components/
│   │   ├── public/              # Componentes de la onepage
│   │   ├── admin/               # Componentes del panel
│   │   └── ui/                  # Componentes base reutilizables
│   ├── lib/
│   │   ├── prisma.ts            # Singleton Prisma client
│   │   ├── auth.ts              # Config NextAuth (Google OAuth)
│   │   ├── storage.ts           # Upload de archivos
│   │   └── utils.ts             # Helpers
│   └── types/
│       └── index.ts             # Tipos compartidos
├── public/
│   └── uploads/                 # Archivos subidos (dev)
├── scripts/
│   ├── backup.sh                # Backup PostgreSQL
│   └── restore.sh               # Restore PostgreSQL
├── .env.example                 # Template de variables
└── docs/
    ├── README.md                    # Índice de documentación
    ├── SETUP_DEV.md                 # Setup entorno local
    ├── UX_CONTEXT.md                # Informe UX/UI completo
    ├── PERFORMANCE_AUDIT.md         # Auditoría de rendimiento
    └── admin/                       # Documentación del panel admin
        ├── README.md
        ├── BLUEPRINT_EVENTOS.md     # Referencia canónica de eventos
        ├── REQUISITOS.md            # Checklist de implementación del admin
        ├── GALERIAS.md              # Arquitectura de componentes de galería
        └── CONVIVENCIA.md           # Guía editorial sección convivencia
```

### Rutas públicas (SSR para SEO)
- `/` → Onepage completa
- `/noticias/[slug]` → Detalle de noticia (si se decide tener páginas individuales)

### Rutas admin (requieren auth)
- `/admin` → Dashboard
- `/admin/noticias` → CRUD noticias
- `/admin/galeria` → CRUD galería
- `/admin/institucional` → Editar info del colegio
- `/admin/mensajes` → Ver mensajes de contacto

### API routes
- `POST /api/contacto` → Recibir mensaje (público, con rate limit)
- `GET /api/noticias` → Listar noticias publicadas (público, cacheable)
- `GET /api/galeria` → Listar álbumes (público, cacheable)
- Todas las demás rutas API requieren auth.

---

## STACK Y DEPENDENCIAS

### Core
- `next` (14.x+) — Framework
- `react`, `react-dom` (18.x+)
- `typescript`
- `prisma`, `@prisma/client` — ORM
- `next-auth` — Autenticación (Google OAuth 2.0)
- `tailwindcss` — Estilos

### Utilidades
- `sharp` — Procesamiento de imágenes (thumbnails, resize). **Tiene build ARM64 nativo.**
- `slugify` — Generación de slugs para noticias
- `dompurify` + `jsdom` — Sanitización de HTML
- `zod` — Validación de schemas en API routes

### Evitar
- **NO** usar `styled-components`, `emotion`, o CSS-in-JS. Solo Tailwind + CSS modules si es necesario.
- **NO** usar ORMs alternativos (TypeORM, Sequelize). Prisma es el estándar del proyecto.
- **NO** instalar component libraries pesadas (MUI, Ant Design, Chakra). Componentes propios con Tailwind.
- **NO** usar `localStorage` o `sessionStorage` para estado persistente. Estado en servidor + React state.
- **NO** usar `moment.js`. Usar `date-fns` o Intl nativo si se necesita formateo de fechas.

---

## IDENTIDAD VISUAL — GARDEN COLLEGE

### Paleta de colores (derivada del escudo del colegio)
```css
:root {
  /* Primarios — del escudo */
  --gc-gold: #C5A835;           /* León dorado — acento principal */
  --gc-gold-light: #D4BC5E;
  --gc-gold-dark: #9E8529;
  --gc-navy: #1B2A4A;           /* Azul oscuro — textos, headers */
  --gc-navy-light: #2D4470;
  --gc-red: #C62828;            /* Rojo — acentos secundarios, CTA */
  --gc-red-light: #E53935;

  /* Neutros */
  --gc-white: #FAFAF8;          /* Fondo principal (no blanco puro) */
  --gc-cream: #F5F0E8;          /* Fondo alternativo, secciones */
  --gc-gray-100: #F0EDE6;
  --gc-gray-200: #E0DCD4;
  --gc-gray-500: #8A8578;
  --gc-gray-700: #4A4640;
  --gc-gray-900: #2A2825;

  /* Semánticos */
  --gc-success: #2E7D32;
  --gc-warning: #F57F17;
  --gc-error: #C62828;
  --gc-info: #1565C0;
}
```

### Tipografía
- **Headings:** Variable, con carácter. Sugerir: `DM Serif Display`, `Playfair Display`, o `Lora`. NUNCA usar Inter, Roboto, Arial para títulos.
- **Body:** Legible, limpia. Sugerir: `Source Sans 3`, `IBM Plex Sans`, o `Nunito Sans`.
- **Accents/badges:** La misma del body en weight diferente.
- Cargar desde Google Fonts via `next/font/google` (auto-optimizado por Next.js).

### Tono visual
- **Cálido y profesional**, no corporativo frío.
- Fotos de actividades del colegio como hero images (no stock).
- El león dorado del escudo es el elemento icónico — usarlo como motivo sutil.
- Evitar estética de "plantilla de WordPress". Cada sección debe sentirse diseñada intencionalmente.
- Mobile first: los apoderados usan celular. Todo se diseña primero para 375px.

### Componentes UI — Principios
- Bordes redondeados suaves (8-12px), no sharp ni excesivamente round.
- Sombras sutiles para elevación, no box-shadow agresivos.
- Transiciones en hover/focus (200-300ms ease).
- Cards con imagen + contenido, no listas planas.
- Botones con estados claros: default, hover, active, disabled, loading.

---

## CONVENCIONES DE CÓDIGO

### TypeScript
- Strict mode activado.
- Interfaces con prefijo `I` solo si hay conflicto de nombres. Preferir sin prefijo.
- Tipos en `src/types/index.ts` para compartidos, colocados junto al componente para locales.
- Usar `satisfies` cuando sea útil para type-checking sin widening.

### Componentes React
- Functional components con arrow functions.
- Props tipadas inline para componentes simples, tipo extraído para componentes complejos.
- Server Components por defecto. `"use client"` solo cuando sea necesario (interactividad).
- Nombrar archivos en PascalCase: `Hero.tsx`, `NoticiaCard.tsx`.

### Prisma
- Schema en español para tablas y campos (consistente con el dominio del negocio).
- Migraciones con nombres descriptivos: `npx prisma migrate dev --name add_galeria_table`.
- Seed en `prisma/seed.ts` con datos iniciales de Garden College.

### Commits
- En español.
- Formato: `tipo: descripción breve`
- Tipos: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `security`
- Ejemplo: `feat: agregar CRUD de noticias en panel admin`

### Archivos de imagen
- Subidas: guardar en `/public/uploads/{año}/{mes}/` en dev, migrar a Object Storage en prod.
- Generar thumbnail automáticamente al subir (sharp, max 400px ancho).
- Formatos aceptados: jpg, png, webp. Convertir a webp para servir.
- Tamaño máximo: 5MB por archivo.

---

## SECCIONES DE LA ONEPAGE

El orden y contenido de cada sección se basa en el PEI del colegio y el análisis de la web actual:

### 1. Hero
- Imagen de fondo: actividad escolar real (no stock)
- Logo del colegio
- Headline: editable desde ConfigSitio
- Subheadline: slogan o frase corta
- CTA primario: "Proceso de Admisión" → sección admisión
- CTA secundario: "Conoce nuestro colegio" → scroll

### 2. Quiénes Somos
- Misión y Visión (desde ConfigSitio)
- Breve párrafo institucional
- Dato de fundación: 2004, La Unión
- Asociado a Educación Adventista desde 2019

### 3. Sellos Educativos (3 cards destacadas)
- **Vida Saludable** — Plan de actividad física y estilos de vida saludable
- **Formación Cristiana** — Educación integral basada en principios y valores bíblicos
- **Inglés** — Enseñanza, aprendizaje y dominio del idioma inglés
- Cada sello: ícono + título + descripción breve (desde ConfigSitio)

### 4. Convivencia y Valores
- **SECCIÓN ESPECIAL** — punto fuerte del colegio
- Logros concretos: campaña "Un Colegio Sin Bullying", cero denuncias
- Enfoque: ambiente seguro, respeto, valores cristianos
- Testimonios o cifras de impacto (editables desde panel)
- Ver `docs/admin/CONVIVENCIA.md` para guía de contenido

### 5. Niveles Educativos
- Parvularia (Pre-Kínder, Kínder) — Sede Los Carrera 387
- Básica (1° a 6°) — Sede Los Carrera 387
- Básica-Media (7° a 8°) — Sede Caupolicán 967
- Media (1° a 4° Medio) — Sede Caupolicán 967
- Mencionar: JEC, PIE, talleres

### 6. Noticias y Actividades
- Grid de últimas 3-6 noticias (cards)
- Contenido dinámico desde BD
- "Ver todas" si hay paginación futura

### 7. Galería
- Álbumes recientes (carousel o grid)
- Thumbnails optimizados
- Lightbox para ver fotos grandes

### 8. Admisión
- Info del proceso (editable)
- Link al SAE del Mineduc (abre en nueva pestaña, NO saca al usuario del sitio sin aviso)
- CTA de contacto

### 9. Contacto
- Dos sedes con dirección y teléfono
- Mapa (Leaflet con OpenStreetMap, NO Google Maps — evitar API key y costo)
- Formulario: nombre, email, teléfono (opcional), asunto, mensaje
- Rate limit en el endpoint: max 5 mensajes por IP por hora

### 10. Footer
- Logo + nombre + "Corporación Educacional Filadelfia Garden"
- Links a secciones
- Redes sociales (Facebook, Instagram, YouTube)
- Link a documentos/reglamentos (página separada o acordeón)

---

## BASE DE DATOS — REGLAS

### ConfigSitio (key-value)
Claves usan formato `grupo.campo`:
```
institucional.nombre_colegio
institucional.slogan
institucional.mision
institucional.vision
institucional.resena
sellos.vida_saludable.titulo
sellos.vida_saludable.descripcion
sellos.formacion_cristiana.titulo
sellos.formacion_cristiana.descripcion
sellos.ingles.titulo
sellos.ingles.descripcion
contacto.sede_basica.direccion
contacto.sede_basica.telefono
contacto.sede_media.direccion
contacto.sede_media.telefono
contacto.email
redes.facebook
redes.instagram
redes.youtube
admision.info
admision.link_sae
convivencia.titulo
convivencia.descripcion
convivencia.logros (JSON array)
```

### Backups
- Backup diario automático via cron en el container.
- Script: `scripts/backup.sh`
- Retención: 30 días.
- Almacenar en volumen externo mapeado.
- **Test de restore mensual** (documentar en DEPLOY.md).

---

## TESTING

- Prioridad: que funcione y se pueda deployar rápido. Testing completo viene después.
- Mínimo: validar que el build de Docker pase sin errores.
- `prisma validate` en CI antes de cada deploy.
- Probar en Chrome mobile emulation (375px) antes de considerar algo "listo".

---

## PERFORMANCE

- Imágenes: servir en webp, con thumbnail para listados.
- Next.js Image component para optimización automática.
- ISR (Incremental Static Regeneration) para la onepage: revalidar cada 60 segundos.
- Las noticias publicadas se cachean. El panel admin invalida cache al publicar/editar.
- Lazy load para galería y secciones below the fold.
- Target: Lighthouse mobile > 80 en todas las métricas.

---

## NOTAS PARA CLAUDE CODE

- El usuario es YoaOses, ingeniero informático. Comunicación directa en español chileno.
- Si algo no es seguro, decirlo aunque sea más trabajo.
- Si algo necesita revisión legal (ley de datos, ley de educación), señalarlo.
- Preferir soluciones simples sobre elegantes. Este proyecto lo mantiene una persona.
- Si un paquete npm no tiene build ARM64, buscar alternativa antes de sugerirlo.
- Cuando haya duda entre rendimiento y simplicidad, elegir simplicidad.
- Nunca generar contenido placeholder tipo "Lorem ipsum". Usar datos reales del PEI del colegio para el seed.
