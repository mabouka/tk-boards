import type { Metadata } from 'next'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { loadQuery } from '@/sanity/lib/loadQuery'
import { boardBySlugQuery } from '@/sanity/lib/queries'
import type { BoardBySlugQueryResult } from '@/sanity.types'
import { getStorefrontProduct } from '@/lib/storefront/product'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import { productGraph } from '@/lib/structured-data'
import JsonLd from '@/components/ui/json-ld/JsonLd'
import { LocalePathsSync } from '@/components/i18n/LocalePaths'
import HeroBoard from '@/components/sections/hero-board/HeroBoard'
import ProductPresentation from '@/components/sections/product-presentation/ProductPresentation'
import PageBuilder from '@/components/sections/page-builder/PageBuilder'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const getBoard = cache((locale: string, slug: string) =>
  client.fetch(boardBySlugQuery, { locale, slug }, sanityCache('board'))
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const board = await getBoard(locale, slug)

  if (!board) return {}

  const settings = await getSiteSettings(locale)

  const translations: { lang: string | null; slug: string | null }[] = Array.isArray(board.translations)
    ? board.translations
    : []
  const languageAlternates = translations
    .filter((tr): tr is { lang: string; slug: string } => Boolean(tr.lang && tr.slug))
    .map((tr) => ({ lang: tr.lang, path: `/boards/${tr.slug}` }))

  return buildMetadata({
    locale,
    path: `/boards/${slug}`,
    title: board.seoTitle ?? board.name,
    absoluteTitle: Boolean(board.seoTitle),
    description: board.seoDescription ?? settings?.seoDescription ?? undefined,
    image: board.ogImage ?? board.mainImage ?? undefined,
    imageAlt: board.ogImage?.alt ?? board.name,
    languageAlternates,
  })
}

export default async function BoardPage({ params }: Props) {
  const { locale, slug } = await params
  const [t, tNav] = await Promise.all([
    getTranslations('boards'),
    getTranslations('nav'),
  ])
  // Draft-aware read (Presentation overlays in preview; published + cache otherwise).
  const board = await loadQuery<BoardBySlugQueryResult>(boardBySlugQuery, { locale, slug }, ['board'])

  if (!board) notFound()

  // Per-locale paths for the header language switcher.
  const localePaths: Record<string, string> = {}
  for (const tr of Array.isArray(board.translations) ? board.translations : []) {
    if (tr?.lang && tr?.slug) localePaths[tr.lang] = `/boards/${tr.slug}`
  }

  const product = board.skuCode ? await getStorefrontProduct(board.skuCode, locale) : null
  const previewImage = board.mainImage
    ? urlFor(board.mainImage).width(1000).quality(85).auto('format').url()
    : null

  // Gallery: dedicated images or mainImage repeated as fallback
  type GalleryImage = { alt?: string | null;[k: string]: unknown }
  const gallery: GalleryImage[] =
    board.gallery && board.gallery.length > 0
      ? board.gallery.slice(0, 3)
      : board.mainImage
        ? [board.mainImage, board.mainImage, board.mainImage]
        : []

  return (
    <div>
      <LocalePathsSync paths={localePaths} />
      <JsonLd
        data={productGraph(board, locale, { home: tNav('home'), boards: t('title') })}
      />

      <HeroBoard
        title={board.heroTitle ?? board.name}
        tagline={board.heroTagline}
        backgroundImage={board.heroImage}
      />

      <ProductPresentation
        sectionLabel={t('section_presentation')}
        title={board.presentationTitle}
        text={board.presentationText}
        numbers={board.presentationNumbers ?? []}
        tags={board.presentationTags ?? []}
        buyLabel={t('buy_now')}
        cartLabel={t('add_to_cart')}
        configureLabel={t('configure')}
        fromLabel={t('from_price')}
        closeLabel={t('close')}
        product={product}
        locale={locale}
        previewImage={previewImage}
        perks={[t('perk_shipping'), t('perk_warranty'), t('perk_payment')]}
        gallery={gallery}
        productName={board.name}
      />

      <PageBuilder sections={board.sections ?? []} locale={locale} />
    </div>
  )
}
