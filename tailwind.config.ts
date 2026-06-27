import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        berry: "#ff5ca8",
        bubble: "#48c9ff",
        grape: "#8758ff",
        cream: "#fff8fd",
        ink: "#34224d"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(135, 88, 255, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
