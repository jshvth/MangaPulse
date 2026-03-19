/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        moss: "rgb(var(--moss) / <alpha-value>)",
        haze: "rgb(var(--haze) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 30px 70px -40px rgba(16, 24, 38, 0.45)",
        glow: "0 0 0 1px rgba(255, 107, 74, 0.15), 0 20px 40px -30px rgba(255, 107, 74, 0.55)",
      },
      borderRadius: {
        xl: "1.25rem",
      },
    },
  },
  plugins: [],
};
