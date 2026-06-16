/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'mine-blue': '#0A2647',
        'mine-blue-2': '#144272',
        'mine-blue-3': '#205295',
        'mine-orange': '#F57C00',
        'mine-bg': '#F0F2F5',
      },
    },
  },
  plugins: [],
};
