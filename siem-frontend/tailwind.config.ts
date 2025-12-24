import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#ffffff',
        },
        'background-dark': '#000000',
        panel: {
          DEFAULT: '#f9fafb',
        },
        'panel-dark': '#0a0a0a',
        border: {
          DEFAULT: '#e5e7eb',
        },
        'border-dark': '#1a1a1a',
        accent: {
          DEFAULT: '#a855f7',
          hover: '#9333ea',
          light: '#c084fc',
          dark: '#7c3aed',
        },
        severity: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        gradient: {
          start: '#a855f7',
          end: '#ec4899',
        },
      },
    },
  },
  plugins: [],
}
export default config

