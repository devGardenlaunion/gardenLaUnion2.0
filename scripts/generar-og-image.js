/**
 * Genera public/og-image.jpg — la tarjeta que se ve al compartir el sitio en
 * WhatsApp, Facebook, Instagram o X.
 *
 *   node scripts/generar-og-image.js
 *
 * Se ejecuta a mano y el resultado se commitea; no corre en el build. Volver a
 * correrlo sólo si cambia el logo, el slogan o los datos de abajo.
 *
 * Es una tarjeta de marca y no una foto a propósito: la imagen queda cacheada
 * de forma indefinida por las redes y no corresponde congelar ahí una foto de
 * estudiantes.
 */
const sharp = require("sharp");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const W = 1200, H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0F2B26"/>
      <stop offset="55%"  stop-color="#143832"/>
      <stop offset="100%" stop-color="#1B4A41"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.7">
      <stop offset="0%"   stop-color="#C5A835" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#C5A835" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- filete dorado inferior -->
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#C5A835"/>

  <!-- texto -->
  <text x="430" y="252" font-family="Georgia, 'DejaVu Serif', serif" font-size="82" font-weight="bold" fill="#FFFFFF">Garden College</text>
  <rect x="432" y="284" width="96" height="6" rx="3" fill="#C5A835"/>
  <text x="430" y="356" font-family="Georgia, 'DejaVu Serif', serif" font-size="40" fill="#D4BC5E">Educación sin fronteras</text>
  <text x="430" y="428" font-family="'DejaVu Sans', Verdana, sans-serif" font-size="29" fill="#FFFFFF" fill-opacity="0.72">La Unión · Región de Los Ríos, Chile</text>
  <text x="430" y="472" font-family="'DejaVu Sans', Verdana, sans-serif" font-size="29" fill="#FFFFFF" fill-opacity="0.72">Prebásica a 4° Medio · Desde 2004</text>
</svg>`;

(async () => {
  const logo = await sharp(path.join(ROOT, "public/media/Logo/cropped-cropped-logo.png"))
    .resize(300, 300, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 165, left: 90 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "public/og-image.jpg"));

  const meta = await sharp(path.join(ROOT, "public/og-image.jpg")).metadata();
  console.log("og-image.jpg", meta.width + "x" + meta.height, meta.size + " bytes");
})();
