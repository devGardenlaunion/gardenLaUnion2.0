/** @type {import('next').NextConfig} */

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
 * Si algún día se agrega un recurso externo (Analytics, un embed, un CDN), hay
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
  'upgrade-insecure-requests',
].join('; ');

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
    ];
  },
};

module.exports = nextConfig;
