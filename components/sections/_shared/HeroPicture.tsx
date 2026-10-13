/* eslint-disable @next/next/no-img-element -- art direction needs <picture> +
   per-source <img>, which next/image can't express; we serve from the Sanity CDN
   via heroImageSrcSets and preload the LCP candidate ourselves. */
import type { SanityImageSource } from '@sanity/image-url'
import { heroImageSrcSets, hasAsset } from '@/sanity/lib/image'

type Props = {
  /** The Sanity image object (asset + crop + hotspot), not a pre-resolved URL. */
  image?: { asset?: unknown } | null
  alt?: string
  /** Portrait box height / width for the mobile crop (e.g. 466/375, 812/375). */
  mobileRatio: number
  /** Class applied to the <img> (each hero positions it to fill its bg). */
  className: string
  /** Shown when the field has no uploaded asset; omit to render nothing. */
  fallbackUrl?: string
}

/**
 * Full-bleed hero background with <picture> art direction: a portrait crop around
 * the hotspot on phones (≤700px), the wide image on desktop; only the matching
 * <source> is fetched. Shared by Hero / HeroBoard / BasicHero.
 *
 * The LCP signal is `fetchPriority="high"` on the <img> (the preload scanner finds
 * it during HTML parse). The two <link rel="preload"> are a best-effort early hint
 * placed at the very top of the body; their `media` mirrors the <source> so only
 * the matching candidate is ever fetched (no double download). Note: a true <head>
 * preload isn't achievable here — React doesn't hoist media-based image preloads
 * (no href), so they stay inline; that's an accepted App-Router limitation.
 */
export default function HeroPicture({ image, alt = '', mobileRatio, className, fallbackUrl }: Props) {
  const src = hasAsset(image) ? (image as SanityImageSource) : null
  const sets = src ? heroImageSrcSets(src, mobileRatio) : null

  if (!sets) {
    return fallbackUrl ? (
      <img src={fallbackUrl} alt={alt} className={className} fetchPriority="high" decoding="async" />
    ) : null
  }

  return (
    <>
      <link
        rel="preload"
        as="image"
        media="(max-width: 700px)"
        imageSrcSet={sets.mobileSrcSet}
        imageSizes="100vw"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        media="(min-width: 701px)"
        imageSrcSet={sets.desktopSrcSet}
        imageSizes="100vw"
        fetchPriority="high"
      />
      <picture>
        <source media="(max-width: 700px)" srcSet={sets.mobileSrcSet} sizes="100vw" />
        <img
          src={sets.fallbackSrc}
          srcSet={sets.desktopSrcSet}
          sizes="100vw"
          alt={alt}
          className={className}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
    </>
  )
}
