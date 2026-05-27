import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Space_Mono, Space_Grotesk } from 'next/font/google'
import { routing } from '@/i18n/routing'
import GridOverlay from '@/components/dev/GridOverlay'
import '../globals.css'

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

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'fr' | 'en' | 'es')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} className={`${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          {process.env.NODE_ENV === 'development' && <GridOverlay />}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
