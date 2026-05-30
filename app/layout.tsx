import type { Metadata } from 'next'
import { Space_Mono, Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'
import { getLocale } from 'next-intl/server'
import { DEFAULT_TITLE, SITE_NAME, siteUrl } from '@/lib/metadata'
import './globals.css'

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const integralCF = localFont({
  variable: '--font-integral',
  src: [
    { path: './fonts/IntegralCF-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/IntegralCF-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: 'TK develops handcrafted strapless boards built around precision. Shaped in Tarifa, Spain.',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth" className={`${spaceMono.variable} ${spaceGrotesk.variable} ${integralCF.variable}`}>
      <body>{children}</body>
    </html>
  )
}
