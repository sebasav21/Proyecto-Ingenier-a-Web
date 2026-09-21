import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        guinda: {
          50:  "#fdf2f4",
          100: "#fbe8ec",
          200: "#f5c9d2",
          300: "#eda0b0",
          400: "#e06e87",
          500: "#c94068",
          600: "#a8223d",
          700: "#7a1030",
          800: "#5e0c25",
          900: "#4a0a1e",
        },
        dorado: {
          400: "#d4a017",
          500: "#b8860b",
          600: "#9a7009",
        },
      },
    },
  },
  plugins: [],
};

export default config;
