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
 * COMPOSICIÓN CENTRADA: WhatsApp muestra el preview compacto y RECORTA la imagen
 * a un CUADRADO central. Por eso todo el contenido (logo + nombre + slogan) va
 * centrado dentro de la zona segura cuadrada (los 630px del medio), así el
 * recorte de WhatsApp se ve bien y la rectangular completa sigue funcionando en
 * Facebook/Twitter.
 */
const sharp = require("sharp");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const W = 1200, H = 630;
const CX = W / 2; // centro horizontal — todo cuelga de acá

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0F2B26"/>
      <stop offset="55%"  stop-color="#143832"/>
      <stop offset="100%" stop-color="#1B4A41"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.32" r="0.6">
      <stop offset="0%"   stop-color="#C5A835" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#C5A835" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- filete dorado inferior -->
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#C5A835"/>

  <!-- texto centrado (zona segura del recorte cuadrado de WhatsApp) -->
  <text x="${CX}" y="398" font-family="Georgia, 'DejaVu Serif', serif" font-size="66" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Garden College</text>
  <rect x="${CX - 50}" y="422" width="100" height="6" rx="3" fill="#C5A835"/>
  <text x="${CX}" y="476" font-family="Georgia, 'DejaVu Serif', serif" font-size="36" fill="#D4BC5E" text-anchor="middle">Educación sin fronteras</text>
  <text x="${CX}" y="536" font-family="'DejaVu Sans', Verdana, sans-serif" font-size="26" fill="#FFFFFF" fill-opacity="0.72" text-anchor="middle">La Unión · Región de Los Ríos · Prebásica a 4° Medio</text>
</svg>`;

(async () => {
  const LOGO = 190;
  const logo = await sharp(path.join(ROOT, "public/media/Logo/cropped-cropped-logo.png"))
    .resize(LOGO, LOGO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 70, left: Math.round(CX - LOGO / 2) }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "public/og-image.jpg"));

  const meta = await sharp(path.join(ROOT, "public/og-image.jpg")).metadata();
  const fs = require("fs");
  const kb = Math.round(fs.statSync(path.join(ROOT, "public/og-image.jpg")).size / 1024);
  console.log("og-image.jpg", meta.width + "x" + meta.height, kb + " KB");
})();
