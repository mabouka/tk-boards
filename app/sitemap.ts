import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { sitemapBoardsQuery, sitemapHomePagesQuery } from '@/sanity/lib/queries'
import { routing } from '@/i18n/routing'
import { siteUrl } from '@/lib/metadata'

// Regenerate at most once an hour so new boards appear without a redeploy.
export const revalidate = 3600

type SitemapBoard = {
  slug: string
  language: string
  _updatedAt: string
  translations: { lang?: string; slug?: string }[] | null
}

type SitemapPage = {
  language: string
  _updatedAt: string
}

const { locales, defaultLocale } = routing

/** hreflang alternates for a path that is identical across all locales. */
function sharedAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = `${siteUrl}/${l}${path}`
  languages['x-default'] = `${siteUrl}/${defaultLocale}${path}`
  return languages
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [boards, homePages] = await Promise.all([
    client.fetch<SitemapBoard[]>(sitemapBoardsQuery),
    client.fetch<SitemapPage[]>(sitemapHomePagesQuery),
  ])

  const homeUpdated: Record<string, string> = Object.fromEntries(
    homePages.map((p) => [p.language, p._updatedAt])
  )
  const latestBoardUpdate = boards.reduce((max, b) => (b._updatedAt > max ? b._updatedAt : max), '')

  // Home — one entry per locale
  const home: MetadataRoute.Sitemap = locales.map((locale): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}/${locale}`,
    lastModified: homeUpdated[locale],
    changeFrequency: 'monthly',
    priority: 1,
    alternates: { languages: sharedAlternates('') },
  }))

  // Boards listing — one entry per locale
  const boardsList: MetadataRoute.Sitemap = locales.map((locale): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}/${locale}/boards`,
    lastModified: latestBoardUpdate || undefined,
    changeFrequency: 'weekly',
    priority: 0.9,
    alternates: { languages: sharedAlternates('/boards') },
  }))

  // Board detail — one entry per board document (per language), with translated-slug alternates
  const boardDetails: MetadataRoute.Sitemap = boards.map((board): MetadataRoute.Sitemap[number] => {
    const translations = Array.isArray(board.translations) ? board.translations : []
    const languages: Record<string, string> = {}
    for (const t of translations) {
      if (t?.lang && t?.slug) languages[t.lang] = `${siteUrl}/${t.lang}/boards/${t.slug}`
    }
    const def = translations.find((t) => t?.lang === defaultLocale && t?.slug)
    if (def?.slug) languages['x-default'] = `${siteUrl}/${defaultLocale}/boards/${def.slug}`

    return {
      url: `${siteUrl}/${board.language}/boards/${board.slug}`,
      lastModified: board._updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
      ...(Object.keys(languages).length > 0 ? { alternates: { languages } } : {}),
    }
  })

  return [...home, ...boardsList, ...boardDetails]
}
