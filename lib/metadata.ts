import type { Metadata } from 'next'
import { cache } from 'react'
import { urlFor } from '@/sanity/lib/image'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { siteSettingsQuery } from '@/sanity/lib/queries'
import { routing } from '@/i18n/routing'
import type { SanityImage } from '@/sanity/lib/types'

/** Absolute origin used to resolve canonical / OG URLs. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

/** og:locale value per app locale. */
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  es: 'es_ES',
}

/** Site-wide settings (brandName, siteTitle, seoDescription, logo, ogImage…),
 *  sourced from the split singletons with SEO text resolved for `locale`.
 *  Memoized per request, per locale. */
export const getSiteSettings = cache((locale: string) =>
  client.fetch(siteSettingsQuery, { locale }, sanityCache('seoSettings', 'contactSettings', 'footerSettings'))
)

/** Extract a Twitter/X handle (e.g. "@tkboards") from an x.com/twitter.com profile URL. */
export function twitterHandle(xUrl?: string | null): string | undefined {
  if (!xUrl) return undefined
  const m = xUrl.match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/)
  return m ? `@${m[1]}` : undefined
}

type BuildMetadataArgs = {
  /** Page-specific title, without the site name. Omit/null to fall back to the default. */
  title?: string | null
  /** Use the title verbatim (skip the "— TK Boards" template). */
  absoluteTitle?: boolean
  description?: string | null
  /** App locale (en | fr | es). */
  locale: string
  /** Path after the locale segment, e.g. "/boards". Must be identical across locales. */
  path?: string
  /** OG image (Sanity image source). */
  image?: SanityImage | null
  imageAlt?: string | null
  /** Emit hreflang alternates for all locales using the same `path`. Use when the
   *  path is identical in every locale (e.g. "/boards"). */
  alternateLanguages?: boolean
  /** Explicit per-language alternates (locale + path after the locale segment).
   *  Use when paths differ across locales, e.g. localized slugs. Only the languages
   *  listed are emitted. Overrides `alternateLanguages`. */
  languageAlternates?: { lang: string; path: string }[]
}

/**
 * Builds a Next.js Metadata object with consistent canonical, Open Graph and
 * Twitter card defaults. Relative URLs are resolved against `metadataBase`
 * (set in the root layout).
 */
export async function buildMetadata({
  title,
  absoluteTitle = false,
  description,
  locale,
  path = '',
  image,
  imageAlt,
  alternateLanguages = false,
  languageAlternates,
}: BuildMetadataArgs): Promise<Metadata> {
  const url = `/${locale}${path}`
  const settings = await getSiteSettings(locale)
  const brandName = settings?.brandName ?? ''
  const twitterSite = twitterHandle(settings?.social?.x)

  const resolvedTitle = title
    ? absoluteTitle
      ? title
      : `${title} — ${brandName}`
    : (settings?.siteTitle ?? '')

  // Collapse newlines / repeated whitespace — meta descriptions should be single-line.
  const resolvedDescription =
    (description ?? settings?.seoDescription ?? '').replace(/\s+/g, ' ').trim()

  // Fall back to the site-wide default OG image when no specific image is provided.
  let ogImage = image
  let ogImageAlt = imageAlt
  if (!ogImage && settings?.ogImage) {
    ogImage = settings.ogImage
    ogImageAlt = imageAlt ?? settings.ogImage.alt
  }

  const images = ogImage
    ? [
        {
          url: urlFor(ogImage).width(1200).height(630).fit('crop').url(),
          width: 1200,
          height: 630,
          alt: ogImageAlt ?? title ?? brandName,
        },
      ]
    : undefined

  let languages: Record<string, string> | undefined
  if (languageAlternates && languageAlternates.length > 0) {
    languages = Object.fromEntries(
      languageAlternates.map((a) => [a.lang, `/${a.lang}${a.path}`])
    )
    const def = languageAlternates.find((a) => a.lang === routing.defaultLocale)
    if (def) languages['x-default'] = `/${def.lang}${def.path}`
  } else if (alternateLanguages) {
    languages = {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      'x-default': `/${routing.defaultLocale}${path}`,
    }
  }

  return {
    ...(title ? { title: absoluteTitle ? { absolute: title } : title } : {}),
    description: resolvedDescription,
    alternates: {
      canonical: url,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type: 'website',
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      ...(twitterSite ? { site: twitterSite, creator: twitterSite } : {}),
      title: resolvedTitle,
      description: resolvedDescription,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  }
}
