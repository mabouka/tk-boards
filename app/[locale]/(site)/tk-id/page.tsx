import type { Metadata } from 'next'
import { cache } from 'react'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { tkIdPageByLocaleQuery } from '@/sanity/lib/queries'
import { resolveHeroImage } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import BasicHero from '@/components/basic-hero/BasicHero'
import PageBuilder from '@/components/page-builder/PageBuilder'

type Props = { params: Promise<{ locale: string }> }

const getTkIdPage = cache((locale: string) =>
  client.fetch(tkIdPageByLocaleQuery, { locale }, sanityCache('tkIdPage'))
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [page, settings] = await Promise.all([getTkIdPage(locale), getSiteSettings(locale)])

  return buildMetadata({
    locale,
    title: page?.seoTitle ?? page?.title ?? 'TK ID',
    absoluteTitle: Boolean(page?.seoTitle),
    description: page?.seoDescription ?? settings?.seoDescription ?? undefined,
    image: page?.ogImage ?? page?.heroImage ?? undefined,
    imageAlt: page?.ogImage?.alt ?? page?.seoTitle ?? page?.title,
    alternateLanguages: true,
  })
}

export default async function TkIdPage({ params }: Props) {
  const { locale } = await params
  const page = await getTkIdPage(locale)

  const heroImageUrl = resolveHeroImage(page?.heroImage) ?? '/samples/channel.jpg'

  return (
    <main>
      <BasicHero
        title={page?.heroTitle || page?.title || 'TK ID'}
        subtitle={page?.heroSubtitle || undefined}
        imageUrl={heroImageUrl}
        imageAlt={page?.heroImage?.alt || ''}
      />
      {page?.sections && page.sections.length > 0 && (
        <PageBuilder sections={page.sections} locale={locale} />
      )}
    </main>
  )
}
