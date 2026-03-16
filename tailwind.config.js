/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whizpoint: {
          blue: '#1976d2'
        }
      }
    },
  },
  plugins: [],
}
