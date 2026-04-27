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
        primary: '#1A56DB',
        accent: '#0EA5E9',
        success: '#16A34A',
        error: '#DC2626',
        warning: '#D97706',
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#1A56DB',
          900: '#1E293B',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '6px',
        pill: '99px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
