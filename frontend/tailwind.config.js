/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#7B93E8',
          main: '#4A6FDC',
          dark: '#2A4FB8',
        },
        secondary: {
          light: '#ADB5BD',
          main: '#6C757D',
          dark: '#495057',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    }
  },
  plugins: [],
};