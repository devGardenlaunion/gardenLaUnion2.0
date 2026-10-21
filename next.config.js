/** @type {import('next').NextConfig} */

/**
 * URLs del WordPress anterior → su equivalente en el sitio actual.
 *
 * Google las siguió mostrando después del cambio (incluso como sitelinks bajo
 * el resultado de marca) y daban 404: el apoderado que buscaba un reglamento
 * caía en una página de error, y el posicionamiento que habían ganado se
 * perdía. Con 301 Google traspasa ese peso a la URL nueva y la reemplaza en el
 * índice. Lista sacada del Internet Archive y de `site:gardenlaunion.cl`
 * (2026-10-21). Ver docs/SEO.md.
 *
 * Lo que no tiene equivalente (noticias viejas, categorías, etiquetas) va a la
 * sección de la home más cercana, no a un 404.
 */
const REDIRECTS_WORDPRESS = {
  // Institucional
  '/quienes-somos': '/#quienes-somos',
  '/conocenos': '/#quienes-somos',
  '/historia': '/#quienes-somos',
  '/centro-de-alumnos': '/#quienes-somos',
  '/talleres': '/#niveles',
  '/horario-de-clases-por-curso': '/#niveles',
  '/galeria-2-0': '/#galeria',
  '/admision': '/#admision',
  '/contacto': '/#contacto',

  // Documentos: cada página del WP tenía un PDF que hoy vive en /documentos
  '/reglamentos-y-protocolos': '/documentos',
  '/proyecto-educativo-institucional': '/documentos?doc=pei',
  '/reglamento-de-covivencia-escolar': '/documentos?doc=reglamento-convivencia',
  '/reglamento-de-evaluacion': '/documentos?doc=reglamento-evaluacion',
  '/reglamento-consejo-escolar': '/documentos?doc=reglamento-consejo-escolar',
  '/protocolo-de-salud-mental': '/documentos?doc=protocolo-salud-mental',
  '/protocolo-de-retencion-y-apoyo-para-estudiantes-embarazadas-padres-y-madres':
    '/documentos?doc=protocolo-retencion-embarazo',
  '/protocolo-frente-a-situaciones-de-consumo-o-venta-de-alcohol-y-drogas':
    '/documentos?doc=protocolo-drogas-alcohol',
  '/protocolo-de-situaciones-de-agresiones-sexuales-y-hechos-de-connotacion-sexual':
    '/documentos?doc=protocolo-agresiones-sexuales',
  '/protocolo-de-situaciones-de-vulneracion-de-derechos-del-estudiantes':
    '/documentos?doc=protocolo-vulneracion-derechos',
  '/protocolo-de-actuacion-frente-a-violencia': '/documentos?doc=protocolo-violencia',
  '/protocolo-frente-a-accidentes-escolares': '/documentos?doc=protocolo-accidentes-escolares',
  '/plan-de-apoyo-a-la-inclusion': '/documentos?doc=plan-inclusion',
  '/plan-de-formacion-ciudadana': '/documentos?doc=plan-formacion-ciudadana',
  '/plan-de-gestion-de-convivencia-escolar': '/documentos?doc=plan-convivencia-escolar',

  // Blog: noticias /AAAA/MM/DD/slug, archivos y taxonomías → Historias
  '/blog': '/#eventos',
  '/page/:n': '/#eventos',
  '/:anio(\\d{4})/:resto*': '/#eventos',
  '/category/:resto*': '/#eventos',
  '/tag/:resto*': '/#eventos',
  '/author/:resto*': '/#eventos',

  // PDFs subidos al WP: Google indexó el PEI directo. Lo específico va antes
  // que el comodín (gana el primer redirect que calza).
  '/wp-content/uploads/2025/04/PEICOLEGIOGARDENCOLLEGE.pdf': '/documentos?doc=pei',
  '/wp-content/uploads/:resto*': '/documentos',

  // Páginas de adjunto de fotos del WP
  '/fachada': '/#galeria',
  '/fotogc:n': '/#galeria',
};

/**
 * Content-Security-Policy.
 *
 * El sitio NO carga ningún recurso de terceros: las fuentes se auto-hospedan
 * con next/font, el "mapa" son links a Waze/Maps (no iframes ni tiles), el único
 * iframe es el visor de PDF, que es del mismo origen. Por eso todo cuelga de
 * 'self' y no hay ni un dominio externo en la lista.
 *
 * `'unsafe-inline'` en script-src: es la única concesión, y es inevitable acá.
 * Next inyecta los scripts de hidratación inline (`self.__next_f.push(...)`).
 * Sacar 'unsafe-inline' exige nonce por request, lo que obliga a render dinámico
 * — y este sitio es 100% estático por requisito duro (ver CLAUDE.md regla #4).
 * Aun con 'unsafe-inline', la CSP sigue cerrando lo que más importa: no se puede
 * cargar un `<script src>` externo, ni exfiltrar por fetch/form a otro dominio,
 * ni secuestrar con `<base>`, ni embeber el sitio en un frame ajeno.
 *
 * Vercel Web Analytics no cuenta como externo: su script y su envío viven en
 * /_vercel/insights/ del mismo dominio.
 *
 * Si algún día se agrega un recurso externo (un embed, un CDN), hay
 * que sumar su origen a la directiva que corresponda o el navegador lo bloquea.
 */
// En `next dev`, React usa eval() para features de debugging (reconstruir
// stacks, source maps) y el HMR usa un WebSocket. Ambos los bloquea la CSP de
// producción. Se relajan SOLO en desarrollo — en build/Vercel NODE_ENV es
// 'production' y la CSP queda estricta (React nunca usa eval en prod).
const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
  "frame-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  // Sólo en Vercel (VERCEL=1), donde todo es HTTPS. Probando el build desde el
  // celular por http://<ip-del-pc>:<puerto>, esta directiva hace que el
  // navegador pida el CSS y el JS por https a esa IP, donde no hay nada, y la
  // página sale sin estilos. localhost se salva porque los navegadores lo
  // exceptúan; una IP de la red local no.
  process.env.VERCEL && 'upgrade-insecure-requests',
].filter(Boolean).join('; ');

// Cabeceras de seguridad. En el deploy de Docker las ponía nginx; en Vercel no
// hay nginx delante, así que las emite Next para TODAS las rutas.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Aísla el contexto de navegación: nada que abramos con window.open puede
  // retener referencia a nuestra ventana. Complementa el rel="noopener".
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // El sitio no usa cámara, micrófono ni geolocalización. El mapa son links a
    // Waze/Google Maps: no pide ubicación del visitante.
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
      'interest-cohort=(), browsing-topics=()',
  },
];

const nextConfig = {
  // No anunciar el framework: `X-Powered-By: Next.js` sólo sirve para que un
  // atacante sepa qué CVEs probar. Menos huella, sin costo.
  poweredByHeader: false,

  // Sin `output: 'standalone'`: eso era para el container de Docker. Vercel
  // arma su propio bundle y activarlo solo agrandaba la función.

  // Evita warning de workspace root con múltiples lockfiles
  turbopack: {
    root: __dirname,
  },

  // Optimización de imágenes
  images: {
    // En dev se desactiva sharp para no saturar RAM con 100+ imágenes de galería
    unoptimized: process.env.NODE_ENV === 'development',
    // Formatos modernos
    formats: ['image/webp', 'image/avif'],
    // Tamaños de dispositivo para responsive
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Los medios del sitio viven en public/ y no cambian sin un deploy:
    // cachearlos un año le ahorra transformaciones a Vercel.
    minimumCacheTTL: 31536000,
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  // Redirect www → apex. Google trata www y apex como sitios distintos: sin
  // esto el link juice se reparte entre dos hostnames.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.gardenlaunion.cl' }],
        destination: 'https://gardenlaunion.cl/:path*',
        permanent: true,
      },
      ...Object.entries(REDIRECTS_WORDPRESS).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
};

module.exports = nextConfig;
