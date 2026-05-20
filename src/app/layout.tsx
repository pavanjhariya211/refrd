import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { BackgroundLayers } from '@/components/layouts/BackgroundLayers'
import './globals.css'

// Three-font stack matching the reference design:
//  - Geist: workhorse body font (replaces Plus Jakarta Sans). Sourced
//    from the official `geist` package since next/font/google only
//    ships Geist from Next 15 onward (we're on 14).
//  - Geist Mono: small caps labels, numbers, eyebrow text.
//  - Instrument Serif: italic accents in hero + section titles.
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
})

const GTM_ID = 'GTM-5B7FV44W'

const SITE_TITLE = 'Refrd — Get referred by verified employees'
const SITE_DESCRIPTION =
  'A competitive auction marketplace where job seekers bid for referrals from verified employees. Upfront payment. Full refund if not selected.'

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s | Refrd',
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  applicationName: 'Refrd',
  keywords: [
    'job referral',
    'employee referral',
    'get referred',
    'job referral marketplace',
    'refer me to a job',
    'verified employee referral',
    'job search',
  ],
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Refrd',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  // Tell browsers the page is dark so native UI (form controls,
  // scrollbars on Mac) renders against the right backdrop.
  themeColor: '#0a0612',
  colorScheme: 'dark',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrument.variable} dark`}
    >
      <head>
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="font-sans bg-bg text-text">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Fixed atmospheric layers — sit behind everything at z-0. */}
        <BackgroundLayers />
        {/* All content is positioned above the background. */}
        <div className="relative z-10">{children}</div>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(22, 16, 41, 0.95)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
            },
          }}
        />
      </body>
    </html>
  )
}
