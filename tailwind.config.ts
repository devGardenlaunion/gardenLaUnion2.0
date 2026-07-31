import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Los valores viven en variables CSS (src/app/globals.css → :root). El
      // patrón rgb(var(--x) / <alpha-value>) preserva los modificadores de
      // opacidad de Tailwind (bg-gc-green/10, text-gc-green-800/60). Cambiar el
      // atributo data-theme del <html> reescribe las variables y flipea el sitio
      // entero (MODO REVISIÓN / tema uniforme).
      colors: {
        // VERDE JADE — color protagonista (uniforme, tartán)
        "gc-green": {
          "50":      "rgb(var(--gc-green-50) / <alpha-value>)",
          "100":     "rgb(var(--gc-green-100) / <alpha-value>)",
          "light":   "rgb(var(--gc-green-light) / <alpha-value>)",
          DEFAULT:   "rgb(var(--gc-green) / <alpha-value>)",
          "dark":    "rgb(var(--gc-green-dark) / <alpha-value>)",
          "800":     "rgb(var(--gc-green-800) / <alpha-value>)",
          "900":     "rgb(var(--gc-green-900) / <alpha-value>)",
        },
        // NAVY — base oscura (fondo tartán, hero, footer)
        "gc-navy": {
          "50":    "rgb(var(--gc-navy-50) / <alpha-value>)",
          "light": "rgb(var(--gc-navy-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--gc-navy) / <alpha-value>)",
          "dark":  "rgb(var(--gc-navy-dark) / <alpha-value>)",
        },
        // DORADO — acento divino + CTA principal
        "gc-gold": {
          "50":    "rgb(var(--gc-gold-50) / <alpha-value>)",
          "light": "rgb(var(--gc-gold-light) / <alpha-value>)",
          DEFAULT: "rgb(var(--gc-gold) / <alpha-value>)",
          "dark":  "rgb(var(--gc-gold-dark) / <alpha-value>)",
        },
        // ROJO — solo errores y alertas
        "gc-red": {
          DEFAULT: "rgb(var(--gc-red) / <alpha-value>)",
          "light": "rgb(var(--gc-red-light) / <alpha-value>)",
        },
        // Neutros
        "gc-white":     "rgb(var(--gc-white) / <alpha-value>)",
        "gc-warm":      "rgb(var(--gc-warm) / <alpha-value>)",
        "gc-cream":     "rgb(var(--gc-cream) / <alpha-value>)",
        "gc-gray-100":  "rgb(var(--gc-gray-100) / <alpha-value>)",
        "gc-gray-200":  "rgb(var(--gc-gray-200) / <alpha-value>)",
        "gc-gray-500":  "rgb(var(--gc-gray-500) / <alpha-value>)",
        "gc-gray-700":  "rgb(var(--gc-gray-700) / <alpha-value>)",
        "gc-gray-900":  "rgb(var(--gc-gray-900) / <alpha-value>)",
        // Alias semánticos
        "gc-success":   "rgb(var(--gc-success) / <alpha-value>)",
        "gc-warning":   "rgb(var(--gc-warning) / <alpha-value>)",
        "gc-error":     "rgb(var(--gc-error) / <alpha-value>)",
        "gc-info":      "rgb(var(--gc-info) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        body: ["var(--font-source-sans)", "system-ui", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
      },
    },
  },
  plugins: [],
};

export default config;
