import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      colors: {
        navy: { 50: "#EEF3FB", 100: "#D9E4F6", 200: "#B3C8EC", 400: "#4B74C4", 600: "#12408F", 700: "#0A3278", 800: "#002868", 900: "#001B47", 950: "#00112E" },
        flag: { 50: "#FDF0F2", 100: "#FAD9DF", 500: "#D81B43", 600: "#BF0A30", 700: "#9C0827" },
        ink: { 900: "#0E1726", 700: "#334155", 500: "#64748B", 300: "#CBD5E1", 100: "#F1F5F9" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,23,38,.04), 0 4px 16px rgba(14,23,38,.05)",
        lift: "0 2px 4px rgba(14,23,38,.05), 0 14px 34px rgba(0,40,104,.12)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { rise: "rise .35s ease-out both", shimmer: "shimmer 1.4s infinite" },
    },
  },
  plugins: [],
};
export default config;
