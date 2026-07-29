import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PROTOTIPO uniforme nuevo (rama feat/uniformes): la familia "gc-green"
        // conserva su NOMBRE pero ahora contiene el NAVY del uniforme, para
        // flipear los 19 componentes sin editarlos. Si se descarta, se revierten
        // estos valores. Escala de luminosidad preservada (50 claro → 900 oscuro).
        "gc-green": {
          "50":      "#EAEEF7",
          "100":     "#CDD9EF",
          "light":   "#5A79BE",
          DEFAULT:   "#2E4E8C",
          "dark":    "#1F386A",
          "800":     "#1A2E52",
          "900":     "#0F1D38",
        },
        // NAVY — base oscura (hero, footer). Se profundiza el dark al navy textil.
        "gc-navy": {
          "50":    "#E8ECF2",
          "light": "#2D4470",
          DEFAULT: "#1B2A4A",
          "dark":  "#0F1B2E",
        },
        // ÁMBAR — acento + monograma GC (afinado al dorado del uniforme)
        "gc-gold": {
          "50":    "#FAF4E4",
          "light": "#E3B23F",
          DEFAULT: "#C79018",
          "dark":  "#8F6910",
        },
        // CARMESÍ — ahora acento REAL de marca (bomber, ribetes), no solo error
        "gc-red": {
          DEFAULT: "#B01722",
          "light": "#D2202C",
        },
        // Neutros
        "gc-white":     "#FAFAF8",
        "gc-warm":      "#FAFAF8",
        "gc-cream":     "#F7F4ED",
        "gc-gray-100":  "#F0EDE6",
        "gc-gray-200":  "#E0DCD4",
        "gc-gray-500":  "#8A8578",
        "gc-gray-700":  "#4A4640",
        "gc-gray-900":  "#2A2825",
        // Alias semánticos
        "gc-success":   "#2E7D32",
        "gc-warning":   "#F57F17",
        "gc-error":     "#C62828",
        "gc-info":      "#1565C0",
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
