/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kantumruy Pro"', 'Inter', '"Noto Sans Khmer"', 'Battambang', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
