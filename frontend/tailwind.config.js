/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          dark: '#0f1f35',
          light: '#2d4a6f',
        },
        charcoal: {
          DEFAULT: '#2d3748',
          dark: '#1a202c',
          light: '#4a5568',
        },
        energy: {
          green: '#10b981',
          yellow: '#fbbf24',
          orange: '#f59e0b',
          red: '#ef4444',
        },
        status: {
          positive: '#10b981',
          neutral: '#6b7280',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
