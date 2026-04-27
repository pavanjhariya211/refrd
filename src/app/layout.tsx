import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Refrd — Get referred by verified employees',
  description:
    'A competitive auction marketplace where job seekers bid for referrals from verified employees. Upfront payment. Full refund if not selected.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={jakarta.className}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
