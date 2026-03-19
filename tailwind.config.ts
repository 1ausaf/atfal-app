import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        gta: {
          background: "var(--gta-background)",
          surface: "var(--gta-surface)",
          surfaceSecondary: "var(--gta-surface-secondary)",
          primary: "var(--gta-primary)",
          secondary: "var(--gta-secondary)",
          text: "var(--gta-text)",
          textSecondary: "var(--gta-text-secondary)",
          border: "var(--gta-border)",
        },
      },
      borderRadius: {
        gta: "var(--gta-radius)",
        "gta-sm": "var(--gta-radius-sm)",
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 6px 12px rgba(0, 0, 0, 0.08)",
        gta: "0 4px 6px rgba(0, 0, 0, 0.05)",
        "gta-hover": "0 6px 12px rgba(0, 0, 0, 0.08)",
      },
      keyframes: {
        "toast-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "toast-unpop": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.8)", opacity: "0" },
        },
        "letter-fold-fly": {
          "0%": { transform: "perspective(800px) rotateX(0deg) rotateZ(0deg) translate(0, 0) scale(1)", opacity: "1" },
          "45%": { transform: "perspective(800px) rotateX(60deg) rotateZ(-6deg) translate(-2%, -6%) scale(0.92)", opacity: "1" },
          "100%": { transform: "perspective(800px) rotateX(90deg) rotateZ(-14deg) translate(-120%, -160%) scale(0.15)", opacity: "0" },
        },
        "points-glow": {
          "0%, 100%": { textShadow: "0 0 12px rgba(251, 191, 36, 0.6)" },
          "50%": { textShadow: "0 0 20px rgba(251, 191, 36, 0.9)" },
        },
        "my-life-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(126, 211, 33, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(126, 211, 33, 0.6)" },
        },
      },
      animation: {
        "toast-pop": "toast-pop 0.3s ease-out forwards",
        "toast-unpop": "toast-unpop 0.25s ease-in forwards",
        "letter-fold-fly": "letter-fold-fly 1.7s ease-in forwards",
        "points-glow": "points-glow 1.5s ease-in-out infinite",
        "my-life-glow": "my-life-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
