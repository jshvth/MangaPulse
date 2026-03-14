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
        canvas: "#f2f5f7",
        ink: "#101826",
        mist: "#f7fafb",
        accent: "#ff6b4a",
        accentSoft: "#ffd6c4",
        teal: "#2f7f7a",
        moss: "#8aa07a",
        haze: "#e8eef2",
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
