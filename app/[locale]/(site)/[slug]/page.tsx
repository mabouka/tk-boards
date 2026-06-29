import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { loadQuery } from '@/sanity/lib/loadQuery'
import {
  cmsPageBySlugQuery,
  faqPageQuery,
  contactPageQuery,
  contactSettingsQuery,
  ourStoryPageQuery,
} from '@/sanity/lib/queries'
import type {
  CmsPageBySlugQueryResult,
  ContactPageQueryResult,
  ContactSettingsQueryResult,
  FaqPageQueryResult,
  OurStoryPageQueryResult,
} from '@/sanity.types'
import { resolveHeroImage } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import BigTitle from '@/components/ui/placeholder/BigTitle'
import FaqPage from '@/components/faq/FaqPage'
import ContactPage from '@/components/contact/ContactPage'
import HeroBoard from '@/components/sections/hero-board/HeroBoard'
import PageBuilder from '@/components/sections/page-builder/PageBuilder'
import { LocalePathsSync } from '@/components/i18n/LocalePaths'

type Props = { params: Promise<{ locale: string; slug: string }> }

const getCmsPage = cache((locale: string, slug: string) =>
  client.fetch(
    cmsPageBySlugQuery,
    { slug, locale },
    sanityCache('page', 'ourStoryPage', 'contactPage', 'faqPage', 'whereToBuyPage')
  )
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
  // Draft-aware read (Presentation overlays in preview; published + cache otherwise).
  const page = await loadQuery<CmsPageBySlugQueryResult>(
    cmsPageBySlugQuery,
    { slug, locale },
    ['page', 'ourStoryPage', 'contactPage', 'faqPage', 'whereToBuyPage']
  )
  if (!page) notFound()

  // Per-locale paths for the header language switcher (slugs differ per locale).
  const localePaths: Record<string, string> = {}
  for (const tr of Array.isArray(page.translations) ? page.translations : []) {
    if (tr?.lang && tr?.slug) localePaths[tr.lang] = `/${tr.slug}`
  }

  if (page._type === 'contactPage') {
    const [contact, settings] = await Promise.all([
      loadQuery<ContactPageQueryResult>(contactPageQuery, { slug, locale }, ['contactPage']),
      loadQuery<ContactSettingsQueryResult>(contactSettingsQuery, {}, ['contactSettings']),
    ])
    const heroImageUrl = resolveHeroImage(contact?.heroImage)

    return (
      <>
        <LocalePathsSync paths={localePaths} />
        <ContactPage
          heroTitle={contact?.heroTitle}
          heroSubtitle={contact?.heroSubtitle}
          heroImageUrl={heroImageUrl}
          heroImageAlt={contact?.heroImage?.alt}
          introEyebrow={contact?.introEyebrow}
          introTitle={contact?.introTitle}
          intro={contact?.intro}
          whatsapp={settings?.whatsapp}
          email={settings?.email}
          sections={contact?.sections}
          locale={locale}
        />
      </>
    )
  }

  if (page._type === 'ourStoryPage') {
    const story = await loadQuery<OurStoryPageQueryResult>(
      ourStoryPageQuery,
      { slug, locale },
      ['ourStoryPage']
    )
    if (!story) notFound()

    return (
      <>
        <LocalePathsSync paths={localePaths} />
        {/* Same hero as the board (Rocket) pages, then page-builder sections. */}
        <HeroBoard
          title={story.heroTitle ?? story.title}
          tagline={story.heroTagline}
          backgroundImage={story.heroImage}
        />
        <PageBuilder sections={story.sections ?? []} locale={locale} />
      </>
    )
  }

  if (page._type === 'faqPage') {
    const faq = await loadQuery<FaqPageQueryResult>(faqPageQuery, { slug, locale }, ['faqPage'])
    if (!faq) notFound()

    // Answer rich text is Portable Text; its images are resolved to URLs in GROQ
    // (asset->url) so the client component never ships @sanity/image-url.
    const categories = (faq.categories ?? [])
      .filter((c): c is typeof c & { title: string } => Boolean(c?.title))
      .map((c) => ({
        id: c._key,
        title: c.title,
        questions: (c.questions ?? []).map((q) => ({
          question: q.question,
          answer: q.answer ?? [],
        })),
      }))

    return (
      <>
        <LocalePathsSync paths={localePaths} />
        <FaqPage title={faq.title} heroTitle={faq.heroTitle} categories={categories} />
      </>
    )
  }

  return (
    <>
      <LocalePathsSync paths={localePaths} />
      <BigTitle>{page.title}</BigTitle>
    </>
  )
}
