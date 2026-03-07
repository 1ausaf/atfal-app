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
    },
  },
  plugins: [],
};
export default config;
