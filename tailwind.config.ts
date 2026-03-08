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
        "points-glow": {
          "0%, 100%": { textShadow: "0 0 12px rgba(251, 191, 36, 0.6)" },
          "50%": { textShadow: "0 0 20px rgba(251, 191, 36, 0.9)" },
        },
      },
      animation: {
        "toast-pop": "toast-pop 0.3s ease-out forwards",
        "toast-unpop": "toast-unpop 0.25s ease-in forwards",
        "points-glow": "points-glow 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
