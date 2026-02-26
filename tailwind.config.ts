import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        slatebg: "#f4f7fb",
        brand: "#0f766e",
        accent: "#f59e0b"
      },
      boxShadow: {
        card: "0 8px 24px rgba(16,24,40,0.08)"
      }
    }
  },
  plugins: [],
};

export default config;
