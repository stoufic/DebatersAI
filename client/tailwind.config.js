/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#0F0F1A',
        surface: '#1A1A2E',
        'pro-green': '#22C55E',
        'con-red': '#EF4444',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        neutral: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
