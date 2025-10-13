/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      // colors: {
      //   board: {
      //     light: '#f3f4f6',
      //     dark: '#0b1220',
      //   },
      //   primary: {
      //     DEFAULT: '#22d3ee',
      //     dark: '#06b6d4',
      //   },
      // },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}

