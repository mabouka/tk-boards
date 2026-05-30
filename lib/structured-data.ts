import type { SiteSettingsQueryResult } from '@/sanity.types'
import { routing } from '@/i18n/routing'
import { SITE_NAME, siteUrl } from './metadata'

/** Stable @id references so nodes can cross-link within the JSON-LD graph. */
export const ORG_ID = `${siteUrl}/#organization`
export const WEBSITE_ID = `${siteUrl}/#website`

/**
 * Sitewide Organization + WebSite graph, sourced from siteSettings.
 * Emitted on every public page; Google de-duplicates by @id.
 */
export function organizationGraph(settings: SiteSettingsQueryResult): Record<string, unknown> {
  const name = settings?.siteTitle || SITE_NAME
  const social = settings?.social ?? {}
  const sameAs = Object.values(social).filter((v): v is string => Boolean(v))
  const email = settings?.contact?.email
  const phone = settings?.contact?.phone
  const description = settings?.seoDescription?.replace(/\s+/g, ' ').trim()

  const organization: Record<string, unknown> = {
    '@type': ['Organization', 'Brand'],
    '@id': ORG_ID,
    name,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteUrl}/#logo`,
      url: `${siteUrl}/apple-icon.png`,
    },
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
