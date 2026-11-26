import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Sistema de diseño de MiMascota.
 *
 * - Paletas de marca: `terracota` (primario, cálido) y `pino` (secundario, confianza).
 * - Neutros cálidos: `arena`.
 * - Colores semánticos (primary, success, warning, ...) se leen de variables CSS
 *   definidas en src/index.css para mantener una sola fuente de verdad.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        terracota: {
          50: "#FDF4EF",
          100: "#FBE5D9",
          200: "#F6C7AE",
          300: "#EFA27C",
          400: "#E5784A",
          500: "#D65C2C",
          600: "#B9461D",
          700: "#993819",
          800: "#7C301A",
          900: "#652A18",
          950: "#371309",
        },
        pino: {
          50: "#EFF7F5",
          100: "#D7EBE6",
          200: "#B0D7CE",
          300: "#7FBBAE",
          400: "#509A8C",
          500: "#357E71",
          600: "#28655B",
          700: "#22524B",
          800: "#1E433E",
          900: "#1B3935",
          950: "#0C201D",
        },
        arena: {
          50: "#FBF8F4",
          100: "#F5F0E9",
          200: "#EBE3D8",
          300: "#DDD1C2",
          400: "#BBA995",
          500: "#978571",
          600: "#7A6A5A",
          700: "#5F5247",
          800: "#40372F",
          900: "#2A211C",
        },
        // Paleta categórica para gráficas (validada: croma, CVD ΔE ≥ 10, contraste ≥ 3:1 sobre blanco)
        chart: {
          1: "#0E8A73",
          2: "#D2562A",
          3: "#5B5FC7",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          soft: "hsl(var(--secondary-soft))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          soft: "hsl(var(--destructive-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          soft: "hsl(var(--info-soft))",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', ...defaultTheme.fontFamily.sans],
        display: ['"Fraunces Variable"', "Georgia", ...defaultTheme.fontFamily.serif],
      },
      fontSize: {
        "display-sm": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["3.25rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-xl": ["4rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 6px)",
        md: "calc(var(--radius) - 4px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
        "3xl": "calc(var(--radius) + 18px)",
      },
      boxShadow: {
        // Sombras con tinte cálido para que no se vean grises sobre fondo arena
        soft: "0 1px 2px rgb(64 40 24 / 0.06), 0 1px 3px rgb(64 40 24 / 0.08)",
        card: "0 1px 2px rgb(64 40 24 / 0.05), 0 4px 16px -4px rgb(64 40 24 / 0.10)",
        lift: "0 2px 4px rgb(64 40 24 / 0.06), 0 14px 32px -8px rgb(64 40 24 / 0.18)",
        overlay: "0 8px 24px -6px rgb(42 33 28 / 0.20), 0 24px 56px -12px rgb(42 33 28 / 0.24)",
        "inner-soft": "inset 0 1px 2px rgb(64 40 24 / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "nav-progress": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(300%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bell-ring": {
          "0%, 100%": { transform: "rotate(0)" },
          "20%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-12deg)" },
          "60%": { transform: "rotate(8deg)" },
          "80%": { transform: "rotate(-4deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.6s infinite",
        "nav-progress": "nav-progress 1.1s ease-in-out infinite",
        "fade-up": "fade-up 0.35s ease-out both",
        "bell-ring": "bell-ring 0.8s ease-in-out",
      },
      transitionTimingFunction: {
        gentle: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [animate],
};

export default config;
