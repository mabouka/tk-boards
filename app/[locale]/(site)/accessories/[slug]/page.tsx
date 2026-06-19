import type { Metadata } from 'next'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { accessoryBySlugQuery } from '@/sanity/lib/queries'
import { getStorefrontProduct } from '@/lib/storefront/product'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import { LocalePathsSync } from '@/components/i18n/LocalePaths'
import ProductPresentation from '@/components/product-presentation/ProductPresentation'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const getAccessory = cache((locale: string, slug: string) =>
  client.fetch(accessoryBySlugQuery, { locale, slug }, sanityCache('accessory'))
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const accessory = await getAccessory(locale, slug)

  if (!accessory) return {}

  const settings = await getSiteSettings(locale)

  const translations: { lang: string | null; slug: string | null }[] = Array.isArray(accessory.translations)
    ? accessory.translations
    : []
  const languageAlternates = translations
    .filter((tr): tr is { lang: string; slug: string } => Boolean(tr.lang && tr.slug))
    .map((tr) => ({ lang: tr.lang, path: `/accessories/${tr.slug}` }))

  return buildMetadata({
    locale,
    path: `/accessories/${slug}`,
    title: accessory.seoTitle ?? accessory.title,
    absoluteTitle: Boolean(accessory.seoTitle),
    description: accessory.seoDescription ?? settings?.seoDescription ?? undefined,
    image: accessory.ogImage ?? accessory.mainImage ?? undefined,
    imageAlt: accessory.ogImage?.alt ?? accessory.title,
    languageAlternates,
  })
}

export default async function AccessoryPage({ params }: Props) {
  const { locale, slug } = await params
  const [t, accessory] = await Promise.all([
    getTranslations('boards'),
    getAccessory(locale, slug),
  ])

  if (!accessory) notFound()

  // Per-locale paths for the header language switcher.
  const localePaths: Record<string, string> = {}
  for (const tr of Array.isArray(accessory.translations) ? accessory.translations : []) {
    if (tr?.lang && tr?.slug) localePaths[tr.lang] = `/accessories/${tr.slug}`
  }

  const product = accessory.skuCode ? await getStorefrontProduct(accessory.skuCode, locale) : null
  const previewImage = accessory.mainImage
    ? urlFor(accessory.mainImage).width(1000).quality(85).auto('format').url()
    : null

  // Gallery: dedicated images, or the main image as a single fallback.
  type GalleryImage = { alt?: string | null;[k: string]: unknown }
  const gallery: GalleryImage[] =
    accessory.gallery && accessory.gallery.length > 0
      ? accessory.gallery.slice(0, 3)
      : accessory.mainImage
        ? [accessory.mainImage]
        : []

  return (
    <div>
      <LocalePathsSync paths={localePaths} />
      <ProductPresentation
        imageSide="left"
        atPageTop
        title={accessory.presentationTitle ?? accessory.title}
        text={accessory.text}
        numbers={accessory.presentationNumbers ?? []}
        tags={accessory.presentationTags ?? []}
        specifications={accessory.specifications ?? []}
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
        productName={accessory.title}
      />
    </div>
  )
}
