import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brutally minimal dark editorial palette
        ink: '#0A0A0A',        // page background
        paper: '#FAFAFA',      // primary text
        accent: '#E8FF47',     // single electric accent
        card: '#111111',       // card surface
        line: '#1F1F1F',       // dividers + card borders
        line2: '#2A2A2A',      // secondary borders
        chip: '#161616',       // pill / chip surface
        muted: '#888888',      // secondary text
        faint: '#555555',      // tertiary text
        // Keep state-colors for refund/error banners — adapted for dark
        primary: '#E8FF47',
        success: '#5EE9B5',
        error: '#FF5C5C',
        warning: '#E8FF47',
      },
      borderRadius: {
        // Sharp corners everywhere; pills/tags use a separate radius
        card: '0px',
        btn: '0px',
        input: '0px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        syne: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
      },
      boxShadow: {
        // No shadows in the new design language.
        none: 'none',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        reveal: 'reveal 400ms ease-out both',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
