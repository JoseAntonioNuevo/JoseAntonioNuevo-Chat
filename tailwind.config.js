/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#7c3aed',
        'primary-dark': '#6d28d9',
        'bg-dark': '#120a23',
        'bg-card': 'rgba(30,24,60,.75)',
        'bg-card-dark': '#1f1940',
        'bg-input': '#1a1433',
        'border-primary': '#2a2352',
        'border-light': '#3a2e6e',
        'text-primary': '#e6e1ff',
        'text-secondary': '#b8aef0',
      },
    },
  },
  plugins: [],
}