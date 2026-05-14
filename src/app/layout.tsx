import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

const GTM_ID = 'GTM-5B7FV44W'

export const metadata: Metadata = {
  title: 'Refrd — Get referred by verified employees',
  description:
    'A competitive auction marketplace where job seekers bid for referrals from verified employees. Upfront payment. Full refund if not selected.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    // Next.js auto-detects src/app/icon.png and src/app/apple-icon.png. The
    // explicit entries below are redundant for the favicon itself but make
    // the icon discoverable to OG-card crawlers and older browsers.
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        {/* Google Tag Manager — next/script hoists this with afterInteractive,
            which is the Next.js App Router-idiomatic equivalent of placing the
            snippet high in <head>. dataLayer is initialised inside the IIFE. */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className={jakarta.className}>
        {/* Google Tag Manager (noscript) — must be the first thing in <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
