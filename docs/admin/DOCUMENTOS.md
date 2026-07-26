# Blueprint: Centro de Documentos

> Especificaciones para el admin de la página `/documentos`.
> **Estado actual:** todos los documentos están hardcodeados en `src/app/documentos/page.tsx`.
> **Objetivo:** mover todo a BD — CRUD completo desde el panel admin, con categorías y tags dinámicos.

---

## 1. Estado actual (hardcodeo)

La página `/documentos` tiene estas limitaciones hoy:

| Elemento | Estado |
|----------|--------|
| Lista de ~20 documentos PDF | Array TypeScript en `src/app/documentos/page.tsx` |
| Categorías (Institucional, Reglamentos, Protocolos, Planes) | Hardcodeadas en el mismo archivo |
| Tags / etiquetas | No existen |
| Orden de documentos | Orden del array, no modificable |
| Agregar/reemplazar documentos | Requiere editar código y hacer deploy |

**Impacto:** agregar un documento nuevo (ej: Protocolo nuevo exigido por Mineduc) requiere
tocar código y deployar — inaceptable para el equipo directivo.

---

## 2. Modelo de datos objetivo

```prisma
model Documento {
  id            String              @id @default(cuid())
  titulo        String
  descripcion   String?
  url           String              // ruta pública del PDF: /documentos/uuid.pdf
  categoriaId   String
  categoria     CategoriaDocumento  @relation(fields: [categoriaId], references: [id])
  tags          TagDocumento[]
  orden         Int                 @default(0)
  visible       Boolean             @default(true)
  creadoEn      DateTime            @default(now())
  actualizadoEn DateTime            @updatedAt
}

model CategoriaDocumento {
  id         String      @id @default(cuid())
  nombre     String      @unique
  orden      Int         @default(0)
  documentos Documento[]
}

model TagDocumento {
  id         String      @id @default(cuid())
  nombre     String      @unique
  documentos Documento[]
}
```

**Migración:** `npx prisma migrate dev --name add_documentos_table`

---

## 3. Lo que el admin gestiona

### Documentos

| Acción | Descripción |
|--------|-------------|
| **Subir PDF** | Upload → `public/documentos/{uuid}.pdf` → registrar en BD |
| **Reemplazar PDF** | Subir nuevo archivo → actualizar `url` en BD — no borrar anterior hasta confirmar |
| **Editar metadatos** | Título, descripción, categoría, tags, orden, visibilidad |
| **Reordenar** | Drag & drop dentro de la categoría — campo `orden` |
| **Mostrar/Ocultar** | Toggle `visible` — el documento queda en BD pero no aparece en la web pública |
| **Eliminar** | Confirmación obligatoria → borrar archivo del servidor + registro en BD |

### Categorías

| Acción | Restricción |
|--------|-------------|
| Crear | Nombre único, orden al final |
| Renombrar | Edición inline |
| Reordenar | Drag & drop — define el orden en el sidebar del viewer público |
| Eliminar | Solo si no tiene documentos asignados (o reasignarlos primero) |

### Tags/Etiquetas

| Acción | Descripción |
|--------|-------------|
| Crear | Desde el formulario de documento — campo de texto + Enter |
| Asignar | Multi-select — un documento puede tener 0 o más tags |
| Eliminar tag global | Solo si ningún documento lo usa |

**Tags vs Categorías:**

| | Categoría | Tag |
|-|-----------|-----|
| Por documento | Exactamente una | Cero o más |
| Uso en UI pública | Filtro en sidebar del DocumentViewer | Futuro: búsqueda avanzada |
| Cantidad esperada | 4–8 | 5–20 |

---

## 4. Pantallas del admin

### `/admin/documentos` — listado

- Tabla agrupada por categoría: título, descripción breve, tags, visible, acciones (editar, eliminar)
- Toggle rápido de visibilidad desde la tabla
- Botón "Agregar documento" → abre formulario (modal o página)
- Botón "Gestionar categorías" → modal con lista reordenable
- Botón "Gestionar tags" → modal con lista + botón eliminar por tag

### Formulario de documento (crear / editar)

```
Campo             Tipo
---------         ----
Título            input[text]  — requerido
Descripción       textarea     — opcional, aparece como subtítulo en el viewer
Categoría         select       — una de CategoriaDocumento
Tags              multi-select + crear tag inline
Visible           toggle       — default: true
Archivo PDF       file input   — solo .pdf, max 50 MB
                  [si editando: mostrar nombre del archivo actual + botón "Reemplazar"]
```

Al guardar:
1. Subir PDF → `POST /api/admin/documentos/upload`
2. Crear/actualizar registro en BD
3. `revalidatePath("/documentos")` para invalidar cache ISR

### Gestión de categorías (modal)

- Lista de categorías con drag & drop para reordenar
- Edición inline de nombre
- Botón "+" para agregar
- Botón eliminar solo si la categoría está vacía

---

## 5. Upload de PDFs

**API route:** `POST /api/admin/documentos/upload`

- Requiere auth (`getServerSession`)
- MIME aceptado: `application/pdf`
- Tamaño máximo: **50 MB** (documentos institucionales pueden ser largos)
- Destino: `public/documentos/{uuid}.pdf`
- Respuesta: `{ url: "/documentos/{uuid}.pdf", nombre_original: "...", tamanio_bytes: N }`
- En producción: migrar destino a Oracle Object Storage (misma interfaz de respuesta)

**No se genera thumbnail** — los PDFs se sirven directamente al iframe o se descargan.

---

## 6. Cómo la página pública lee los documentos (post-migración)

Modificar `src/app/documentos/page.tsx`:

```ts
// Antes (hardcodeado):
const documentos: Documento[] = [ ... array de 20 items ... ]

// Después (desde BD):
const documentos = await prisma.documento.findMany({
  where: { visible: true },
  include: { categoria: true, tags: true },
  orderBy: [
    { categoria: { orden: "asc" } },
    { orden: "asc" },
  ],
})

const categorias = await prisma.categoriaDocumento.findMany({
  orderBy: { orden: "asc" },
})
```

El componente `DocumentViewer` recibe `documentos` y `categorias` — su interfaz ya acepta estos datos, no cambia.

---

## 7. Relación con recursos.ts

Los links en `src/data/recursos.ts` usan `?doc=pei` y `?doc=reglamento-convivencia` para
abrir directamente un documento en el viewer. Al migrar a BD:

- El campo `initialDocId` de `DocumentViewer` pasa de hardcoded ID a ID de BD
- Los IDs de BD son `cuid()` — los links en `recursos.ts` (o su sucesor en BD) deben usar los IDs reales
- **Al hacer el seed**, los documentos migrados deben quedar con IDs predecibles, o los recursos deben
  apuntar por slug en lugar de ID (decisión a tomar al implementar)

> Ver también: `src/data/recursos.ts` — pendiente migrar a BD según `REQUISITOS.md`.

---

## 8. Migración desde el hardcodeo — paso a paso

Al implementar el admin de documentos, seguir este orden:

1. Crear migración Prisma: `add_documentos_table`
2. Crear seed con los documentos actuales de `src/app/documentos/page.tsx`:
   - Categorías: Institucional, Reglamentos, Protocolos, Planes (en ese orden)
   - ~20 documentos con sus títulos, descripciones y URLs (`/documentos/*.pdf`)
   - Los archivos PDF ya existen en `public/documentos/`
3. Modificar `src/app/documentos/page.tsx` para leer desde BD
4. Modificar los links de `recursos.ts` (o su sucesor en BD) para que apunten a los IDs correctos
5. Eliminar el array hardcodeado del código

---

## 9. Categorías y tags iniciales (seed)

**Categorías iniciales** (orden indicado):

| Orden | Nombre |
|-------|--------|
| 1 | Institucional |
| 2 | Reglamentos |
| 3 | Protocolos |
| 4 | Planes |

**Tags sugeridos** (no obligatorios, el admin puede crear los suyos):

| Tag | Descripción |
|-----|-------------|
| Vigente | Documento en uso activo |
| Histórico | Versión anterior, conservada para referencia |
| Mineduc | Exigido por normativa Mineduc |
| 2023 / 2024 / 2025 | Año de vigencia |

> Los tags del seed son orientativos. El admin puede ignorarlos y crear su propia taxonomía.

---

## 10. ISR y cache

- La página `/documentos` no necesita ISR agresivo — los documentos cambian con baja frecuencia.
- `revalidate = 3600` (1 hora) en `src/app/documentos/page.tsx` es suficiente.
- Al guardar desde el admin: `revalidatePath("/documentos")` para forzar actualización inmediata.
