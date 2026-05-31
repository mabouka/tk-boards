import type { Metadata } from 'next'
import { Space_Mono, Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'
import { getLocale } from 'next-intl/server'
import { getSiteSettings, siteUrl } from '@/lib/metadata'
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const brandName = settings?.brandName ?? ''
  const defaultTitle = settings?.siteTitle ?? ''
  const defaultDescription = (settings?.seoDescription ?? '').replace(/\s+/g, ' ').trim()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s — ${brandName}`,
    },
    description: defaultDescription,
    openGraph: {
      siteName: brandName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth" className={`${spaceMono.variable} ${spaceGrotesk.variable} ${integralCF.variable}`}>
      <body>{children}</body>
    </html>
  )
}
