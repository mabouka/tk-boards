import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { cmsPageBySlugQuery } from '@/sanity/lib/queries'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import BigTitle from '@/components/placeholder/BigTitle'

type Props = { params: Promise<{ locale: string; slug: string }> }

const getCmsPage = cache((locale: string, slug: string) =>
  client.fetch(cmsPageBySlugQuery, { slug, locale })
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getCmsPage(locale, slug)
  if (!page) return {}

  const settings = await getSiteSettings(locale)

  // hreflang alternates from the translation metadata (slugs differ per locale).
  const translations: { lang: string | null; slug: string | null }[] = Array.isArray(
    page.translations
  )
    ? page.translations
    : []
  const languageAlternates = translations
    .filter((tr): tr is { lang: string; slug: string } => Boolean(tr.lang && tr.slug))
    .map((tr) => ({ lang: tr.lang, path: `/${tr.slug}` }))

  return buildMetadata({
    locale,
    path: `/${slug}`,
    title: page.seoTitle ?? page.title,
    absoluteTitle: Boolean(page.seoTitle),
    description: page.seoDescription ?? settings?.seoDescription ?? undefined,
    image: page.ogImage ?? page.heroImage ?? undefined,
    imageAlt: page.ogImage?.alt ?? page.seoTitle ?? page.title,
    languageAlternates: languageAlternates.length > 0 ? languageAlternates : undefined,
  })
}

// Polymorphic CMS route: resolves any page type (page, ourStoryPage, contactPage,
// faqPage, whereToBuyPage) by slug+locale. Static routes keep precedence.
// Renders just a big title for now — real templates per _type come later.
export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params
  const page = await getCmsPage(locale, slug)
  if (!page) notFound()

  return <BigTitle>{page.title}</BigTitle>
}
