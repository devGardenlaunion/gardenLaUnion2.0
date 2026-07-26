/** @type {import('next').NextConfig} */

// Cabeceras de seguridad. En el deploy de Docker las ponía nginx; en Vercel no
// hay nginx delante, así que las emite Next para TODAS las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // El sitio no usa cámara, micrófono ni geolocalización. El mapa es Leaflet
    // sobre tiles de OSM: no pide ubicación del visitante.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig = {
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
