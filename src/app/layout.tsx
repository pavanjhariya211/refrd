import type { Metadata } from 'next'
import { Inter, Syne, DM_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-syne',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Refrd — Get referred by verified employees',
  description:
    'A competitive auction marketplace where job seekers bid for referrals from verified employees. Upfront payment. Full refund if not selected.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${dmMono.variable}`}
    >
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#111111',
              color: '#FAFAFA',
              border: '1px solid #1F1F1F',
              borderRadius: 0,
              fontFamily: 'var(--font-inter), sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
