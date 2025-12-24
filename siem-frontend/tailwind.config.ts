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
          DEFAULT: '#00d9ff',
          hover: '#00b8d9',
          light: '#33e0ff',
          dark: '#0099cc',
        },
        severity: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        gradient: {
          start: '#00d9ff',
          end: '#0099cc',
        },
      },
    },
  },
  plugins: [],
}
export default config

