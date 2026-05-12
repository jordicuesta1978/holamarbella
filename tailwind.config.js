/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4B766B',
        'primary-dark': '#1A3021',
        arena: '#F5F2EA',
        surface: '#fcf9f8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Noto Serif', 'serif'],
      },
    },
  },
  plugins: [],
}