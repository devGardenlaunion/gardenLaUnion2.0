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
 *
 * La marca es el isotipo GC (rebrand del uniforme nuevo): navy + aro dorado +
 * monograma. Va dibujado inline como SVG para que salga vectorial y nítido.
 */
const sharp = require("sharp");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const W = 1200, H = 630;
const NAVY = "#0C1D33", GOLD = "#C99A2E", GC = "#CBA03A";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0A1524"/>
      <stop offset="55%"  stop-color="#101F38"/>
      <stop offset="100%" stop-color="#1B3358"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.7">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- filete dorado inferior -->
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${GOLD}"/>

  <!-- isotipo GC (navy + aro dorado + monograma), inline y vectorial -->
  <g transform="translate(90,165) scale(0.586)">
    <circle cx="256" cy="256" r="256" fill="${GOLD}"/>
    <circle cx="256" cy="256" r="242" fill="${NAVY}"/>
    <g font-family="Liberation Serif, 'DejaVu Serif', serif" font-weight="700" font-size="300">
      <text x="182" y="316" text-anchor="middle" fill="${GC}">G</text>
      <text x="338" y="392" text-anchor="middle" fill="${GC}" stroke="${NAVY}" stroke-width="16" paint-order="stroke">C</text>
    </g>
  </g>

  <!-- texto -->
  <text x="430" y="252" font-family="Georgia, 'DejaVu Serif', serif" font-size="82" font-weight="bold" fill="#FFFFFF">Garden College</text>
  <rect x="432" y="284" width="96" height="6" rx="3" fill="${GOLD}"/>
  <text x="430" y="356" font-family="Georgia, 'DejaVu Serif', serif" font-size="40" fill="#D9AD46">Educación sin fronteras</text>
  <text x="430" y="428" font-family="'DejaVu Sans', Verdana, sans-serif" font-size="29" fill="#FFFFFF" fill-opacity="0.72">La Unión · Región de Los Ríos, Chile</text>
  <text x="430" y="472" font-family="'DejaVu Sans', Verdana, sans-serif" font-size="29" fill="#FFFFFF" fill-opacity="0.72">Prebásica a 4° Medio · Desde 2004</text>
</svg>`;

(async () => {
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "public/og-image.jpg"));

  const meta = await sharp(path.join(ROOT, "public/og-image.jpg")).metadata();
  console.log("og-image.jpg", meta.width + "x" + meta.height, meta.size + " bytes");
})();
