import type { BoardBySlugQueryResult, SiteSettingsQueryResult } from '@/sanity.types'
import { routing } from '@/i18n/routing'
import { urlFor } from '@/sanity/lib/image'
import { siteUrl } from './metadata'

/** Stable @id references so nodes can cross-link within the JSON-LD graph. */
const ORG_ID = `${siteUrl}/#organization`
const WEBSITE_ID = `${siteUrl}/#website`

/**
 * Sitewide Organization + WebSite graph, sourced from the site settings
 * (seoSettings / contactSettings / footerSettings, merged by siteSettingsQuery).
 * Emitted on every public page; Google de-duplicates by @id.
 */
export function organizationGraph(settings: SiteSettingsQueryResult): Record<string, unknown> {
  const name = settings?.brandName ?? ''
  const social = settings?.social ?? {}
  const sameAs = Object.values(social).filter((v): v is string => Boolean(v))
  const email = settings?.contact?.email
  const phone = settings?.contact?.phone
  const description = settings?.seoDescription?.replace(/\s+/g, ' ').trim()
  const logoUrl = settings?.logo ? urlFor(settings.logo).width(512).url() : undefined

  const organization: Record<string, unknown> = {
    '@type': ['Organization', 'Brand'],
    '@id': ORG_ID,
    name,
    url: siteUrl,
    ...(logoUrl
      ? {
          logo: {
            '@type': 'ImageObject',
            '@id': `${siteUrl}/#logo`,
            url: logoUrl,
          },
        }
      : {}),
    ...(description ? { description } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(email || phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
            availableLanguage: [...routing.locales],
          },
        }
      : {}),
  }

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteUrl,
    name,
    publisher: { '@id': ORG_ID },
    inLanguage: [...routing.locales],
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  }
}

/** Map a currency code to its Schema.org availability URL. */
const AVAILABILITY_IN_STOCK = 'https://schema.org/InStock'

type BreadcrumbLabels = { home: string; boards: string }

/**
 * Product + BreadcrumbList graph for a board detail page.
 * The Product references the sitewide Organization (#organization) as its brand,
 * so it must be rendered on a page that also includes organizationGraph().
 */
export function productGraph(
  board: NonNullable<BoardBySlugQueryResult>,
  locale: string,
  labels: BreadcrumbLabels
): Record<string, unknown> {
  const boardUrl = `${siteUrl}/${locale}/boards/${board.slug?.current ?? ''}`
  const productId = `${boardUrl}#product`

  const images = board.mainImage
    ? [urlFor(board.mainImage).width(1200).height(900).fit('crop').url()]
    : undefined

  // Map presentation numbers into structured PropertyValue entries.
  const specProps = (board.presentationNumbers ?? [])
    .filter((n) => Boolean(n?.value && n?.label))
    .map((n) => ({
      '@type': 'PropertyValue',
      name: n.label as string,
      value: n.unit ? `${n.value} ${n.unit}` : (n.value as string),
    }))
  if (typeof board.weight === 'number') {
    specProps.push({ '@type': 'PropertyValue', name: 'Weight', value: `${board.weight} kg` })
  }

  const description =
    board.seoDescription?.replace(/\s+/g, ' ').trim() ||
    board.presentationTitle?.replace(/\s+/g, ' ').trim() ||
    undefined

  const product: Record<string, unknown> = {
    '@type': 'Product',
    '@id': productId,
    name: board.name,
    url: boardUrl,
    brand: { '@id': ORG_ID },
    ...(images ? { image: images } : {}),
    ...(description ? { description } : {}),
    ...(board.style ? { category: board.style } : {}),
    ...(specProps.length > 0 ? { additionalProperty: specProps } : {}),
    ...(typeof board.price === 'number'
      ? {
          offers: {
            '@type': 'Offer',
            url: boardUrl,
            price: board.price.toFixed(2),
            priceCurrency: board.currency ?? 'EUR',
            availability: AVAILABILITY_IN_STOCK,
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': ORG_ID },
          },
        }
      : {}),
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${boardUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: labels.home, item: `${siteUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: labels.boards, item: `${siteUrl}/${locale}/boards` },
      { '@type': 'ListItem', position: 3, name: board.name },
    ],
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [product, breadcrumb],
  }
}
