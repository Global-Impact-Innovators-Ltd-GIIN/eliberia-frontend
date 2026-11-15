import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lib: { blue: "#002868", red: "#BF0A30", light: "#EEF2FA" },
      },
    },
  },
  plugins: [],
};
export default config;
