/**
 * Prueba la configuración SMTP del formulario de contacto.
 *
 *   node scripts/probar-smtp.js
 *
 * Lee las mismas variables que usa el sitio (desde .env) y envía un correo real
 * a CONTACTO_TO. Sirve para separar dos problemas que desde el navegador se ven
 * igual: "las credenciales están mal" y "el formulario tiene un bug".
 *
 * No toca el código de la app: sólo verifica que la cuenta pueda enviar.
 */
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Carga mínima de .env — sin dependencias extra.
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const linea of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    // Corta el comentario de fin de línea y las comillas envolventes.
    // El "#" sólo abre comentario al principio del valor o tras un espacio: así
    // una contraseña que contenga "#" pegado no se trunca.
    const valor = m[2]
      .replace(/(?:^|\s)#.*$/, "")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = valor;
  }
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACTO_FROM, CONTACTO_TO, CONTACTO_FROM_NAME } = process.env;

const faltan = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !process.env[k]);
if (faltan.length) {
  console.error(`\n✗ Faltan variables en .env: ${faltan.join(", ")}\n`);
  console.error("  Ver .env.example para el detalle de cada una.\n");
  process.exit(1);
}

// SMTP_USER no es la dirección del remitente: con Resend vale "resend".
const remitente = (CONTACTO_FROM || "").includes("@")
  ? CONTACTO_FROM
  : (SMTP_USER || "").includes("@")
  ? SMTP_USER
  : null;
const destino = (CONTACTO_TO || "").includes("@") ? CONTACTO_TO : remitente;

if (!remitente || !destino) {
  console.error("\n✗ Falta CONTACTO_FROM (dirección del remitente) o CONTACTO_TO.\n");
  console.error("  SMTP_USER sólo sirve de remitente si es un email — con Resend");
  console.error("  vale \"resend\", así que CONTACTO_FROM es obligatoria.\n");
  process.exit(1);
}

const puerto = Number(SMTP_PORT) || 587;
const esResend = /resend/i.test(SMTP_HOST);

console.log("\nConfiguración detectada:");
console.log(`  Servidor : ${SMTP_HOST}:${puerto} (${puerto === 465 ? "SSL directo" : "STARTTLS"})`);
console.log(`  Usuario  : ${SMTP_USER}`);
console.log(`  Password : ${"•".repeat(SMTP_PASS.length)} (${SMTP_PASS.length} caracteres)`);
console.log(`  Remitente: ${remitente}`);
console.log(`  Destino  : ${destino}\n`);

if (!esResend && /\s/.test(SMTP_PASS)) {
  console.warn("⚠ La contraseña tiene espacios. Google la MUESTRA en grupos de 4,");
  console.warn("  pero hay que pegarla sin espacios: abcdefghijklmnop\n");
}

if (esResend && !SMTP_PASS.startsWith("re_")) {
  console.warn("⚠ La API key de Resend empieza con 're_'. Revisá que sea la key");
  console.warn("  completa y no un fragmento.\n");
}

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: puerto,
  secure: puerto === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

(async () => {
  try {
    process.stdout.write("1/2 Verificando credenciales... ");
    await transport.verify();
    console.log("OK");

    process.stdout.write("2/2 Enviando correo de prueba... ");
    const info = await transport.sendMail({
      from: `"${CONTACTO_FROM_NAME || "Garden College Web"}" <${remitente}>`,
      to: destino,
      subject: "[Prueba] Formulario de contacto — Garden College",
      text:
        "Si estás leyendo esto, el envío de correo del sitio funciona.\n\n" +
        `Enviado el ${new Date().toLocaleString("es-CL")} desde scripts/probar-smtp.js`,
    });
    console.log("OK");
    console.log(`\n✓ Correo enviado a ${destino} (id: ${info.messageId})`);
    console.log("  Revisá también la carpeta de spam.\n");
  } catch (e) {
    console.log("FALLÓ\n");
    console.error(`✗ ${e.message}\n`);

    const m = String(e.message);
    if (m.includes("Invalid login") || m.includes("535") || m.includes("BadCredentials")) {
      if (esResend) {
        console.error("  Causa habitual: la API key es incorrecta o fue revocada.");
        console.error("  SMTP_USER debe ser la palabra literal 'resend' y SMTP_PASS");
        console.error("  la API key completa (empieza con 're_').\n");
      } else {
        console.error("  Causa habitual: la contraseña NO es una 'Contraseña de aplicación'.");
        console.error("  La contraseña normal de la cuenta no sirve para SMTP: hay que");
        console.error("  activar la verificación en 2 pasos y generar una de 16 caracteres");
        console.error("  en https://myaccount.google.com/apppasswords\n");
      }
    } else if (esResend && (m.includes("domain") || m.includes("not verified") || m.includes("403"))) {
      console.error(`  Causa habitual: el dominio de ${remitente} no está verificado en Resend.`);
      console.error("  Mientras no lo esté, sólo se puede enviar desde");
      console.error("  onboarding@resend.dev y ÚNICAMENTE al correo de tu cuenta Resend.\n");
    } else if (m.includes("ETIMEDOUT") || m.includes("ECONNREFUSED")) {
      console.error("  Causa habitual: el puerto está bloqueado por la red o el firewall.");
      console.error("  Probar con SMTP_PORT=465 en vez de 587.\n");
    }
    process.exit(1);
  }
})();
