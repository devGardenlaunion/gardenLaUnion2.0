# Auditoría de Rendimiento — Garden College Web
Fecha: 2026-04-23 | Auditor: Claude Code

---

## 🔴 Crítico (impacto alto en CPU/rendimiento)

- **Hero: `preload="auto"` en el video**
  El browser descarga el archivo completo (4.6 MB `.webm`) al cargar la página,
  incluso en usuarios mobile que nunca verán el video (el `<video>` está oculto en
  portrait). En una conexión 4G lenta esto bloquea o retrasa todos los demás recursos.
  → Cambiar a `preload="none"`. El video arranca igual gracias a `autoPlay` — el
  browser inicia la descarga en cuanto empieza la reproducción.

- **Hero: sin `poster` en el `<video>`**
  Mientras el video no ha descargado su primer frame, el área de fondo queda
  completamente negra. Eso golpea directamente el LCP (Largest Contentful Paint) y
  produce un flash visible al cargar.
  → Agregar `poster="/media/Hero/hero-poster.jpg"` (captura del primer frame del video,
  ~40–80 KB en JPEG). El poster se muestra instantáneamente y desaparece cuando el video
  arranca.

- **Hero: video reproduce sin límite aunque el usuario no lo vea**
  No hay `IntersectionObserver` para pausarlo cuando sale del viewport, ni listener
  `visibilitychange` para pausarlo al cambiar de tab. El GPU/CPU decodifica video
  continuamente aunque el usuario esté en la sección de Contacto o haya minimizado
  el browser.
  → Agregar un `useEffect` con `IntersectionObserver` + `visibilitychange` que llame
  a `videoRef.current.pause()` / `.play()` según corresponda. Reducción estimada:
  ~20–40% CPU en mobile mientras el usuario navega below the fold.

---

## 🟡 Moderado (optimizable)

- **Hero: solo `.webm`, sin fallback `.mp4`**
  Safari < 16 y browsers de bajo rango no soportan WebM. En esos casos el video
  simplemente no aparece (queda negro si tampoco hay `poster`).
  → Agregar `<source src="/media/Hero/heroShort.mp4" type="video/mp4" />` como segundo
  `<source>`. El `.mp4` puede generarse con `ffmpeg -i heroShort.webm heroShort.mp4`.

- **Hero: imagen mobile (`<img>`) sin `width`/`height` ni `fetchpriority`**
  El `<img src={mobileSrc}>` no declara dimensiones, lo que produce CLS (Cumulative
  Layout Shift) mientras carga. Además, siendo above the fold, debería tener
  `fetchpriority="high"` para competir con el video.
  → Usar `next/image` con `fill` (igual que la imagen real en Admisión), o agregar
  `width` y `height` + `fetchpriority="high"`.

- **EventosWrapper: `<img>` directo en lugar de `next/image`**
  Las imágenes de portada de eventos (hero card + grid) usan `<img>` sin optimización.
  No se genera WebP/AVIF automáticamente, no hay `srcset` responsivo. La imagen hero
  del evento tampoco tiene `loading="lazy"` (está below the fold en la onepage).
  → Reemplazar por `next/image` con `fill` + `sizes` apropiado. Hasta que se migre,
  agregar `loading="lazy"` en la imagen hero del evento.

- **CarouselLinkCard: `carousel-fade 9s infinite` en 3 imágenes simultáneas**
  La sección Convivencia renderiza 1 card con hasta 3 imágenes superpuestas, cada una
  con `animation: carousel-fade 9s infinite`. Son 3 capas con `opacity` animada
  perpetuamente. En GPU compositing esto es barato, pero en CPUs mobile de gama baja
  puede generar janky scrolling si hay más layers activos en pantalla.
  → Bajo impacto con 1 sola card. Si en el futuro se agregan más cards con imágenes,
  considerar pausar la animación con `animation-play-state: paused` fuera del viewport
  via IntersectionObserver.

- **GaleriaPolaroid: `mousemove` sin throttle**
  El handler `handleMouseMove` llama a `setHoveredIndex` en cada evento de movimiento
  del mouse, disparando un re-render de React potencialmente 60 veces por segundo sobre
  un componente con cálculo de distancias O(n) para cada foto.
  → Agregar throttle con `requestAnimationFrame` o `lodash.throttle(fn, 16)`. El efecto
  visual es idéntico; los re-renders caen a máximo 60/s controlado.

- **GaleriaPolaroid: `resize` sin debounce**
  El listener de `resize` llama a `setIsMobile` en cada píxel de cambio de tamaño de
  ventana. En desktop con resize manual dispara decenas de re-renders + recálculo de
  `positions` (useMemo).
  → `debounce(check, 150)` es suficiente. El useMemo ya cachea el resultado, pero el
  dispatch del setState es innecesariamente frecuente.

- **Navbar: `<img>` directo para el logo**
  No bloqueante (el logo es pequeño y está above the fold), pero no genera WebP ni
  tiene `width`/`height` declarados.
  → Cambiar a `next/image` con `width={72} height={72}` para evitar CLS y beneficiarse
  de la optimización automática.

---

## 🟢 OK

- **Fuentes:** Cargadas con `next/font/google` (Lora + Source_Sans_3). `display: "swap"` 
  en ambas. Solo subset `latin`. Sin `@import` de Google Fonts en CSS. ✅

- **Scroll listener en Navbar:** Usa `{ passive: true }` y tiene `removeEventListener` 
  en el cleanup del useEffect. ✅

- **next.config.js:** Formatos `webp` + `avif`, `deviceSizes` bien configurado, 
  sin imágenes remotas innecesarias. ✅

- **Third-party scripts:** Sin Google Analytics, Tag Manager, Hotjar, ni iframes 
  de Google Maps o YouTube. Cero scripts síncronos de terceros. ✅

- **EventosWrapper: imágenes del grid con `loading="lazy"`** ✅

- **GaleriaPolaroid: todos los listeners tienen cleanup** (`resize`, `keydown`). ✅

- **Sin `setInterval` o `requestAnimationFrame` en loop** en ningún componente. ✅

- **Video Hero:** `autoPlay muted loop playsInline` todos presentes. ✅

---

## Prioridad de implementación sugerida

| # | Item | Impacto | Esfuerzo |
|---|------|---------|----------|
| 1 | Hero: `preload="none"` | Alto (ancho de banda) | 1 línea |
| 2 | Hero: `poster` | Alto (LCP) | 1 línea + generar imagen |
| 3 | Hero: `.mp4` fallback | Medio (compatibilidad) | 1 línea + ffmpeg |
| 4 | Hero: pause on invisible | Medio (CPU) | ~20 líneas |
| 5 | EventosWrapper: `next/image` | Medio (peso imágenes) | ~30 min |
| 6 | GaleriaPolaroid: throttle mousemove | Bajo (CPU mobile) | 5 líneas |
| 7 | GaleriaPolaroid: debounce resize | Bajo | 3 líneas |
| 8 | Navbar logo: `next/image` | Bajo | 5 líneas |
