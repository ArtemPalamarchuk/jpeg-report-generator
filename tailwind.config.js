/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#8B9AFD',
        'brand-blue': '#223FFA',
      },
      fontFamily: {
        'bai': ['Bai Jamjuree', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
