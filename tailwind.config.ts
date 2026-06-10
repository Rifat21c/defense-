import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#051424",
        surface: "#0d1c2d",
        "surface-lowest": "#010f1f",
        "surface-low": "#0d1c2d",
        "surface-container": "#122131",
        "surface-high": "#1c2b3c",
        "surface-highest": "#273647",
        "on-surface": "#d4e4fa",
        "on-surface-variant": "#b9cacb",
        outline: "#849495",
        primary: "#dbfcff",
        "primary-container": "#00f0ff",
        "primary-fixed": "#7df4ff",
        "primary-fixed-dim": "#00dbe9",
        secondary: "#d0bcff",
        "secondary-container": "#571bc1",
        error: "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        label: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        "container-max": "1440px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 219, 233, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
