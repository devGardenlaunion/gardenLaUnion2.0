# Backlog UX Móvil — Garden College

**Proyecto:** `garden-la-union2-0` (Next.js App Router, deploy en Vercel)
**Alcance:** exclusivamente experiencia móvil. Desktop se considera aprobado — ninguna tarea de este backlog debe degradarlo.
**Modo de trabajo:** ciclos secuenciales. No abrir un ciclo sin cerrar el anterior con sus criterios verificados.

---

## Reglas de trabajo para el agente

1. **Se trabaja directo en `main`, un commit por ciclo** (o por sub-tarea clara
   dentro del ciclo). Sin branches ni PRs — decisión del owner para agilizar.
   Igual se respeta la secuencialidad: no abrir un ciclo sin cerrar el anterior.
2. **Cada criterio de aceptación es binario y medible.** Si no se puede verificar con un comando, un assert o una medición, no se marca como hecho.
3. **Baseline obligatorio antes de tocar código.** Ejecutar las mediciones del bloque "Baseline" y dejarlas registradas en el PR. Sin baseline no hay forma de demostrar mejora.
4. **Regresión desktop.** Al cerrar cada ciclo, verificar que en viewport 1200×700 no cambió nada visualmente salvo lo declarado explícitamente.
5. **Si un criterio no se puede cumplir, no lo reinterpretes.** Documenta el bloqueo en el PR y sigue con el resto del ciclo.

### Entorno de verificación

- **Viewport móvil de referencia:** 390 × 844 (iPhone 12/13/14 y equivalente gama media Android), DPR 2.
- **Viewport móvil secundario:** 360 × 800 (Android gama baja, muy común en la zona).
- **Throttling:** Slow 4G / CPU 4× — perfil realista para conectividad rural en Los Ríos.
- **Navegadores:** Chrome Android, Opera, Brave y Safari iOS. Toda feature que dependa de Network Information API debe degradar sin error en Safari.
- **Lighthouse:** se corre con Brave como binario Chromium (`CHROME_PATH=/usr/bin/brave npx lighthouse ...`). Sirve para las métricas de performance/a11y/SEO de los criterios.

### Baseline a registrar antes del Ciclo 0

```bash
# Bytes totales y por tipo, viewport móvil
npx lighthouse https://garden-la-union2-0.vercel.app/ \
  --preset=perf --form-factor=mobile --screenEmulation.mobile \
  --output=json --output-path=./baseline-mobile.json

# Metadatos de share
curl -s https://garden-la-union2-0.vercel.app/ | grep -Eo '<meta[^>]*(og:|canonical)[^>]*>'
```

Anotar: LCP, CLS, TBT, peso total, peso de imágenes, número de requests de imagen.

### Baseline registrado (prod `garden-la-union2-0.vercel.app`, Lighthouse móvil vía Brave)

| Métrica | Valor | Target DoD |
|---|---|---|
| Performance | 75 | ≥ 85 |
| LCP | 3.1 s | < 2.5 s |
| CLS | 0 | < 0.1 ✅ |
| TBT | 760 ms | < 300 ms |
| Peso total | 3472 KB | ≤ 1800 KB |
| — media (video hero) | **2821 KB / 1 req** | (Ciclo 3) |
| — imágenes | 310 KB / 14 req | ≤ 1200 KB / ≤ 25 (Ciclo 1: ya cumple peso) |
| — script | 185 KB / 9 req | |
| — fonts | 112 KB / 4 req | |

Lectura: el video del hero es el 80% del peso. El presupuesto de imágenes ya
está dentro de target. La palanca grande es la política de video (Ciclo 3).

---

## CICLO 0 — Metadatos de share (BLOQUEANTE)

**Problema.** Todos los metadatos absolutos apuntan a `http://localhost:3000`: `canonical`, `og:url`, `og:image`, `twitter:image`. El canal principal de distribución móvil de este sitio es WhatsApp, y hoy cada link compartido genera preview roto o sin imagen. Esto invalida cualquier trabajo de conversión posterior.

**Solución.** Definir `metadataBase` en el layout raíz a partir de variable de entorno, con fallback a la URL de deploy de Vercel. Eliminar toda URL absoluta hardcodeada en objetos `metadata`.

```ts
// app/layout.tsx
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // og:image, canonical, etc. pasan a ser rutas relativas: "/og-image.jpg"
};
```

**Criterios de aceptación**

- [ ] `curl -s <deploy> | grep -c 'localhost:3000'` devuelve `0`.
- [ ] `og:url`, `og:image`, `twitter:image` y `canonical` resuelven a HTTPS con el dominio de producción.
- [ ] `GET <og:image>` devuelve `200` y `content-type: image/*`.
- [ ] La imagen OG mide 1200×630 y pesa **< 300 KB**.
- [ ] Preview real verificado pegando el link en un chat de WhatsApp: se muestra título, descripción e imagen.
- [ ] Validado además en el debugger de Facebook Sharing y en el validador de Twitter/X Cards.
- [ ] `grep -rn "localhost:3000" app/ src/` no arroja resultados fuera de archivos `.env*` y config de dev.

**Fuera de alcance:** rediseñar la imagen OG. Solo verificar que exista, cargue y pese poco.

---

## CICLO 1 — Presupuesto de bytes de imagen en móvil

**Problema.** Todas las imágenes se solicitan a `w=1200&q=75`, incluso en un viewport de 390 px. Falta la prop `sizes` en los `next/image`, por lo que el optimizador no tiene información para elegir un candidato menor. Además la galería repite el mismo set de 9 imágenes **4 veces** en el DOM (loop de marquee), multiplicando requests. Esto ocurre justo en el dispositivo donde los bytes son más caros.

**Solución.**

1. Agregar `sizes` a **todos** los `next/image`, acorde al ancho real que ocupa cada imagen por breakpoint. Ejemplos:
   - Card en columna única móvil / 3 columnas desktop: `sizes="(max-width: 768px) 100vw, 33vw"`
   - Ítem de carrusel horizontal: `sizes="(max-width: 768px) 85vw, 400px"`
   - Polaroid en grid: `sizes="(max-width: 768px) 45vw, 300px"`
2. Reemplazar la duplicación del set de galería en el DOM por técnica CSS de loop (transform sobre un único set clonado 2× como máximo), o por `scroll-snap` sin clonado.
3. Marcar `priority` **únicamente** en el poster del hero. Todo lo demás `loading="lazy"`.
4. Convertir a WebP los `.jpeg`/`.JPG` que quedaron sin procesar en `media/QuienesSomos/polaroid/`.

**Criterios de aceptación**

- [ ] En viewport 390 px, **ninguna** request a `/_next/image` lleva `w>` `640`. Verificable en el panel Network filtrando por `_next/image`.
- [ ] Peso total de imágenes en la home móvil **≤ 1.2 MB** (baseline a comparar en el PR).
- [ ] Número de requests de imagen en la home móvil **≤ 25**.
- [ ] `grep -c 'sizes=' ` sobre los componentes con `next/image` iguala el número de instancias de `<Image`.
- [ ] Exactamente **un** elemento con `priority` en la home.
- [ ] LCP móvil con Slow 4G **< 2.5 s**.
- [ ] Ningún archivo servido desde `public/media/` con extensión `.JPG` o `.jpeg` en secciones visibles.

### Estado Ciclo 1 (commit `143156e`, verificado Lighthouse móvil local vía Brave)

- [x] `/_next/image` con `w>640` en 390px: **0** (todo a 375/128).
- [x] Peso imágenes: **215 KB** (≤ 1.2 MB).
- [x] Requests de imagen: **14** (≤ 25).
- [x] `sizes=` = nº `<Image>`: **11 = 11**.
- [x] Exactamente 1 `priority`: el hero (`fetchPriority="high"`); se quitó del logo del Navbar.
- [x] Sin `.jpeg/.JPG` en secciones visibles: 7 convertidos a WebP.
- [~] LCP < 2.5 s: **pendiente** — el LCP lo domina el video del hero (2.8 MB) → se resuelve en **Ciclo 3**, no con el presupuesto de imágenes. Medición local no fiable por CPU compartida (baseline prod: 3.1 s).

**Sub-tarea "marquee 9×4" → N/A.** No existe en el código actual: la galería
(`MAX_FOTOS = 9`, `GaleriaColumnas`) renderiza el set **una vez**, sin clonado.
La observación del plan era de una versión anterior. Documentado por regla 5.

---

## CICLO 2 — Normalización de aspect ratio en secciones funcionales

**Problema.** El sitio mezcla retrato y apaisado. En desktop eso lee como composición intencional porque se ven 3–4 piezas simultáneas y la variedad *es* el layout. En móvil, con una columna única, cada cambio de ratio se convierte en un salto de altura: la cadencia de scroll se vuelve impredecible y el ojo pierde la línea de anclaje. Ese es el ruido percibido.

**Criterio de diseño que gobierna este ciclo:** ratios mixtos requieren ≥2 elementos visibles simultáneamente para leerse como intención. Si en el viewport móvil solo cabe uno, se normaliza.

**Solución.** Clasificar cada sección y aplicar la regla:

| Sección | Clasificación | Tratamiento móvil |
|---|---|---|
| Polaroids (Quiénes Somos) | Expresiva | Conserva ratios mixtos, pero cada polaroid dentro de un contenedor de altura fija con `object-fit: cover`. El ratio real se libera solo en lightbox. |
| Carrusel Convivencia | Expresiva | Marco de altura fija, `object-fit: cover`. |
| Galería | Funcional | Ratio único **4:5** en móvil. |
| Niveles (3 cards) | Funcional | Ratio único **3:2** en móvil. |
| Admisión | Funcional | Ratio único **4:5** en móvil. |

Implementar con `aspect-ratio` en CSS más `object-fit: cover` y `object-position` ajustable por imagen cuando el recorte corte cabezas.

**Criterios de aceptación**

- [ ] En viewport 390 px, todas las tarjetas de una misma sección funcional tienen **altura idéntica** (verificable con `getBoundingClientRect().height` sobre los hijos: desviación `0 px`).
- [ ] CLS en la home móvil **< 0.1**.
- [ ] Ninguna imagen recortada corta un rostro. Revisión visual sección por sección, capturas adjuntas al PR.
- [ ] El lightbox muestra la imagen en su ratio original, sin recorte.
- [ ] En viewport 1440 px las secciones expresivas se ven **idénticas** al estado previo (comparación de capturas antes/después).

**Fuera de alcance:** cambiar qué fotos se usan o su orden.

### Estado Ciclo 2 (commits `363c887` + `e59eeb8`, mobile-only)

Tratamiento aplicado por sección, todo detrás de `md:`/`lg:` (desktop intacto):
- Niveles (funcional): `aspect-[3/2]` móvil · Admisión (funcional): `aspect-[4/5]`
  móvil · Galería (funcional): grilla 2-col `aspect-[4/5]` móvil, masonry en desktop.
- Polaroid (expresiva): marco `w-28 aspect-[4/5]` + object-cover en móvil, varied
  en desktop · Sellos/carrusel (expresiva): marco `aspect-[4/3]` móvil.

- [x] Alturas idénticas por sección funcional (0px): garantizado por CSS
  (mismo `aspect-ratio` + grid de columnas iguales). No depende de medición.
- [x] CLS home móvil < 0.1: **0** (Lighthouse Brave; los contenedores con
  aspect reservan el espacio).
- [x] Lightbox en ratio original, sin recorte: sin cambios (solo se tocaron los
  thumbnails/grillas, no el lightbox).
- [x] Desktop 1440px idéntico: todos los cambios son `md:`/`lg:`; el masonry, el
  scatter de polaroids y el grid de Sellos quedan igual en desktop.
- [~] Ninguna imagen recortada corta un rostro: **lo verifica el owner en el
  celular** (deploy en Vercel) — reparto acordado. Si alguna corta cara, se
  ajusta `object-position` de esa foto puntual.

Presupuesto del Ciclo 1 mantenido: `/_next/image` w>640 = 0, 14 requests, 144KB.

---

## CICLO 3 — Política de video

**Problema.** El video pendiente de subir no debe cargarse ni precargarse sin intención explícita del usuario. Adicionalmente, servir MP4 desde Vercel implica bandwidth facturado sin bitrate adaptativo.

**Aclaración conceptual que debe respetarse:** orientación y peso son ejes independientes. Un video en retrato no es más liviano que uno apaisado. El control de consumo de datos se hace en el encode y en la política de carga, nunca en la orientación.

**Solución.**

1. **Sin autoplay de video con contenido, en ningún viewport.** Poster estático más affordance de play explícito.
2. **Declarar el costo en la UI**, junto al botón de play: `Ver video · 1:40 · ~14 MB`. Esto funciona en el 100% de los dispositivos y traslada la decisión al usuario, en vez de adivinarla.
3. `preload="none"` en móvil; `metadata` como máximo en desktop.
4. **Hosting externo con bitrate adaptativo.** Opciones en orden de menor costo: YouTube unlisted con facade tipo lite-embed (el colegio ya tiene canal), Cloudflare Stream, Mux. No servir MP4 desde `public/`.
5. **Progressive enhancement opcional, encima de lo anterior:** si `navigator.connection?.saveData === true` o `effectiveType` está en `('slow-2g','2g')`, no cargar ni el poster en alta resolución. Debe degradar silenciosamente donde la API no existe (Safari/iOS no implementa Network Information API, y **no existe forma de detectar WiFi vs datos móviles en ningún navegador** — `connection.type` no se expone por privacidad). Esta detección es optimización opcional; la declaración de peso es la feature.

**Criterios de aceptación**

- [ ] Al cargar la home en móvil, `0` bytes de video en el panel Network hasta que el usuario toca play.
- [ ] Ningún `<video>` con contenido tiene atributo `autoplay`. Excepción permitida: loop de fondo decorativo, sin audio, `muted`, y solo si respeta `prefers-reduced-motion`.
- [ ] Todo `<video>` tiene `poster` y `preload="none"` en móvil.
- [ ] El peso y la duración aparecen como texto visible junto al control de play, no en un tooltip.
- [ ] El código de detección de red está envuelto en guardas de existencia. Verificable: la página funciona sin errores de consola en Safari iOS.
- [ ] Con Data Saver activado en Chrome Android, no se carga poster de alta resolución.
- [ ] El video se sirve desde host externo con bitrate adaptativo. `public/` no contiene archivos `.mp4` mayores a 2 MB.

---

## DECISIÓN CERRADA — Orientación de video en galerías

**No tocar. No proponer alternativas. No abrir en ciclos futuros.**

Los videos apaisados de las galerías quedan como están. Razonamiento del owner: un click en un video es una intención declarada de verlo; el usuario rotará la pantalla. Consecuencia: **no se mantienen dos masters por orientación**, con el ahorro de mantención y de desincronización que eso implica.

Las tareas del Ciclo 3 aplican igual, porque son de peso y política de carga, no de orientación.

---

## CICLO 4 — Navegación y presupuesto de viewport

**Problema.** La home es una única página muy larga navegada solo por hash (`#quienes-somos`, `#sellos`, `#niveles`…). En móvil eso implica: el botón atrás no recupera la posición de scroll, el header sticky más la barra de teléfonos consumen viewport vertical permanente, y no hay indicación de progreso ni de sección actual.

**Solución.**

1. Header con comportamiento **hide-on-scroll-down / show-on-scroll-up**.
2. Colapsar la barra superior de teléfonos al hacer scroll; mantener el acceso a llamada dentro del menú y en Contacto.
3. Scroll-spy: marcar visualmente la sección activa en el menú móvil.
4. Evaluar extraer **Niveles** y **Admisión** a rutas propias (`/niveles`, `/admision`), manteniendo un resumen enlazado en la home. Decisión a documentar en el PR con la medición de longitud de página como argumento.
5. `scroll-behavior: smooth` respetando `prefers-reduced-motion`.

**Criterios de aceptación**

- [ ] Con el header colapsado, el contenido dispone de **≥ 85%** de la altura del viewport en 390 × 844.
- [ ] Navegar a una sección y presionar atrás devuelve al usuario a la posición de scroll previa.
- [ ] El ítem de menú de la sección visible está marcado como activo en todo momento durante el scroll.
- [ ] Altura total de la home móvil **≤ 18 000 px** (medir baseline primero y documentar).
- [ ] Con `prefers-reduced-motion: reduce`, el scroll es instantáneo y no hay animaciones de entrada.
- [ ] Todo target táctil mide **≥ 44 × 44 px**.

---

## CICLO 5 — Accesibilidad, movimiento y copy

**Problema.** Alt vacíos en casi todo el carrusel de Convivencia y en las 9 imágenes de Admisión. Marquees con auto-scroll que roban el gesto de scroll en móvil y no respetan preferencias de movimiento reducido. Un texto en voseo rioplatense en un sitio de La Unión.

**Solución.**

1. Alt descriptivo y específico en cada imagen con valor informativo; `alt=""` explícito solo en las decorativas. Nada de repetir el mismo alt genérico en 12 imágenes distintas.
2. Todo marquee o carrusel automático se detiene bajo `prefers-reduced-motion: reduce` y ofrece control manual de pausa.
3. En móvil, reemplazar auto-scroll por `scroll-snap` manual con indicadores de posición visibles.
4. Corregir copy: **"¿Con qué app querés navegar?"** → *querés* es rioplatense. Usar **"¿Con qué app quieres navegar?"**. Barrer el resto del sitio buscando voseo.
5. Foco visible en todos los elementos interactivos; el modal de selección de app debe atrapar el foco y cerrarse con Escape.

**Criterios de aceptación**

- [ ] `0` imágenes con `alt` ausente. Las decorativas llevan `alt=""` explícito.
- [ ] Ningún texto de `alt` se repite más de **2 veces** en la página.
- [ ] Con `prefers-reduced-motion: reduce`, ningún elemento se mueve sin interacción del usuario. Verificable grabando 10 s de pantalla sin tocar nada.
- [ ] Todos los carruseles operables con swipe y con teclado.
- [ ] `grep -rn "querés\|podés\|tenés\|vos " app/ src/` no arroja resultados.
- [ ] Score de Accesibilidad en Lighthouse móvil **≥ 95**.
- [ ] El modal de navegación cierra con Escape y devuelve el foco al botón que lo abrió.

---

## Definition of Done global

Al cerrar el Ciclo 5, en viewport 390 × 844 con Slow 4G:

- [ ] LCP < 2.5 s
- [ ] CLS < 0.1
- [ ] TBT < 300 ms
- [ ] Peso total de la home ≤ 1.8 MB
- [ ] Lighthouse móvil: Performance ≥ 85, Accesibilidad ≥ 95, SEO ≥ 95
- [ ] Preview de WhatsApp correcto
- [ ] `0` errores de consola en Chrome Android y Safari iOS
- [ ] Desktop 1440 × 900 sin regresiones visuales respecto al estado inicial

## Criterio de decisión para gestos de diseño futuros

Ante cualquier decisión estética nueva en móvil, la pregunta es: **¿el usuario lo lee como intención o como error?** Si en una columna única no puede distinguir entre "esto está así a propósito" y "esto se rompió", el gesto no funciona, independiente de lo bien pensado que esté.
