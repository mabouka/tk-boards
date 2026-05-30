import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/metadata'
import { organizationGraph } from '@/lib/structured-data'
import JsonLd from '@/components/json-ld/JsonLd'
import GridOverlay from '@/components/dev/GridOverlay'
import BackgroundCanvas from '@/components/background/BackgroundCanvas'
import BgHalos from '@/components/background/BgHalos'
import BgConfigurator from '@/components/background/BgConfigurator'

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

  const [messages, settings] = await Promise.all([getMessages(), getSiteSettings()])

  return (
    <>
      <JsonLd data={organizationGraph(settings)} />
      <BackgroundCanvas />
      <BgHalos />
      <NextIntlClientProvider messages={messages}>
        {children}
        {process.env.NODE_ENV === 'development' && <GridOverlay />}
        {process.env.NODE_ENV === 'development' && <BgConfigurator />}
      </NextIntlClientProvider>
    </>
  )
}
