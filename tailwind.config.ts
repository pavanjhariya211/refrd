import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Atmospheric dark base.
        bg: '#0a0612',
        'bg-elev': '#120b1f',
        'bg-card': '#161029',
        'bg-card-hi': '#1d1635',
        // Text ramp.
        text: '#f4f1fa',
        'text-soft': '#b5acc9',
        'text-faint': '#6f6789',
        // Borders use rgba so they sit subtly on any layer.
        border: 'rgba(255,255,255,0.08)',
        'border-hi': 'rgba(255,255,255,0.14)',
        // Accent palette — violet/pink/indigo build the brand;
        // green/amber are reserved for status (success, warning).
        violet: '#a855f7',
        'violet-bright': '#c084fc',
        'violet-deep': '#7e22ce',
        indigo: '#6366f1',
        pink: '#ec4899',
        // Status retained for buttons, toasts, badges.
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // Legacy aliases the rest of the app still imports.
        // Re-pointed at the violet ramp so we don't have to chase down
        // every `text-primary` / `bg-primary` reference in one commit.
        primary: '#a855f7',
        accent: '#6366f1',
        amber: '#f59e0b',
        green: '#10b981',
        brand: {
          50: '#1d1635',
          100: '#241b3f',
          600: '#a855f7',
          900: '#0a0612',
        },
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
        input: '10px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 16px 48px rgba(168, 85, 247, 0.18)',
        glow: '0 0 32px rgba(168, 85, 247, 0.35)',
        'glow-pink': '0 0 32px rgba(236, 72, 153, 0.35)',
      },
      fontFamily: {
        // Geist is now the body face; Plus Jakarta is gone. The geist
        // package sets --font-geist-sans / --font-geist-mono.
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        // Instrument Serif drives every italic accent in section
        // titles, hero headlines, and step numerals.
        serif: ['var(--font-instrument)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-violet': 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
        'gradient-violet-pink':
          'linear-gradient(135deg, #c084fc 0%, #ec4899 100%)',
        'gradient-hero':
          'linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #6366f1 100%)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        'reveal-in': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'reveal-in': 'reveal-in 0.8s ease forwards',
      },
    },
  },
  plugins: [typography],
}

export default config
