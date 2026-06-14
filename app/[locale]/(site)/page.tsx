import type { Metadata } from 'next'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { homePageByLocaleQuery } from '@/sanity/lib/queries'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import Hero from '@/components/hero/Hero'
import PageBuilder from '@/components/page-builder/PageBuilder'

type Props = {
  params: Promise<{ locale: string }>
}

const getHomePage = cache((locale: string) =>
  client.fetch(homePageByLocaleQuery, { locale }, sanityCache('homePage'))
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [page, settings] = await Promise.all([getHomePage(locale), getSiteSettings(locale)])

  return buildMetadata({
    locale,
    title: page?.seoTitle ?? undefined,
    absoluteTitle: Boolean(page?.seoTitle),
    description: page?.seoDescription ?? settings?.seoDescription ?? undefined,
    image: page?.ogImage ?? page?.heroImage ?? undefined,
    imageAlt: page?.ogImage?.alt ?? page?.seoTitle ?? page?.title,
    alternateLanguages: true,
  })
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('home')

  const page = await getHomePage(locale)

  return (
    <>
      <Hero
        title={page?.heroTitle ?? page?.title ?? t('hero_title')}
        subtitle={page?.heroSubtitle ?? t('hero_subtitle')}
        backgroundImage={page?.heroImage ?? undefined}
      />
      {page?.sections && (
        <PageBuilder sections={page.sections} locale={locale} />
      )}
    </>
  )
}
