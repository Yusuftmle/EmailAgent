/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#030712",
        darkSurface: "#0b0f19",
        darkBorder: "rgba(255, 255, 255, 0.06)",
        neonIndigo: "#6366f1",
        neonPurple: "#a855f7",
        neonFuchsia: "#d946ef",
        neonCyan: "#06b6d4",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}
