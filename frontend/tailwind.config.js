/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0f172a",
        surfaceCard: "#131d33",
        surfaceBorder: "#1e293b",
        electric: {
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        cyanGlow: {
          400: "#22d3ee",
          500: "#06b6d4"
        }
      }
    },
  },
  plugins: [],
}
