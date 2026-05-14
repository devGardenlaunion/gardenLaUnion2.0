/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output para Docker (reduce tamaño del container significativamente)
  output: 'standalone',

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
    // Dominios permitidos para imágenes remotas (agregar si se usa CDN)
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    // Tamaños de dispositivo para responsive
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers de seguridad adicionales (los principales van en nginx)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // Redirect www → sin www (si se configura así)
  // async redirects() {
  //   return [
  //     {
  //       source: '/:path*',
  //       has: [{ type: 'host', value: 'www.gardencollege.cl' }],
  //       destination: 'https://gardencollege.cl/:path*',
  //       permanent: true,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
