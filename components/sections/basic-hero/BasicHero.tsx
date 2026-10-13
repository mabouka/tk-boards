import type { SanityImageSource } from '@sanity/image-url'
import { urlFor, hasAsset } from '@/sanity/lib/image'
import styles from './BasicHero.module.css'

type Props = {
  title: string
  subtitle?: string
  /** The Sanity image object (asset + crop + hotspot) — NOT a pre-resolved URL,
   *  so urlFor can honour the editor's crop & focal point. */
  image?: { asset?: unknown } | null
  imageAlt?: string
  /** Shown when the field has no uploaded asset. */
  fallbackUrl?: string
}

// Portrait crop ratio for the mobile hero: 375 × 466 (what the design asks for).
const MOBILE_RATIO = 466 / 375
const MOBILE_WIDTHS = [375, 640, 750, 828, 1080, 1200]
const DESKTOP_WIDTHS = [828, 1080, 1200, 1536, 1920]

const srcSet = (variants: string[]) => variants.join(', ')

/**
 * Full-bleed image hero with a centered title + optional subtitle (Figma 1422-1091).
 * The fixed header overlays the top transparently. Reusable across pages.
 *
 * Art direction via <picture>: phones (≤700px) get a 375×466 portrait CROP of the
 * source (≈750×932 @2×, ~10× lighter than the landscape), desktops get the wide
 * image. The browser downloads only the matching <source> — eagerly + high
 * fetchpriority, since the hero is the LCP element.
 *
 * Both srcsets are built with urlFor().width().height().fit('crop'), so Sanity's
 * editorial crop (rect) AND hotspot (focal point) are respected — a hand-rolled
 * ?w=…&h=…&fit=crop on a pre-resolved URL would center-crop and ignore both.
 */
export default function BasicHero({
  title,
  subtitle,
  image,
  imageAlt = '',
  fallbackUrl = '/samples/channel.jpg',
}: Props) {
  const src = hasAsset(image) ? (image as SanityImageSource) : null

  // Desktop: width-only — keeps the editorial crop, no forced aspect.
  // Mobile: width+height+crop — forces the 375:466 box around the hotspot.
  const desktopSrcSet = src
    ? srcSet(DESKTOP_WIDTHS.map((w) => `${urlFor(src).width(w).quality(85).auto('format').url()} ${w}w`))
    : undefined
  const mobileSrcSet = src
    ? srcSet(
        MOBILE_WIDTHS.map(
          (w) =>
            `${urlFor(src)
              .width(w)
              .height(Math.round(w * MOBILE_RATIO))
              .fit('crop')
              .quality(85)
              .auto('format')
              .url()} ${w}w`
        )
      )
    : undefined
  const fallbackSrc = src ? urlFor(src).width(1920).quality(85).auto('format').url() : fallbackUrl

  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <picture>
          {src && <source media="(max-width: 700px)" srcSet={mobileSrcSet} sizes="100vw" />}
          <img
            src={fallbackSrc}
            srcSet={desktopSrcSet}
            sizes={src ? '100vw' : undefined}
            alt={imageAlt}
            className={styles.image}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className={styles.overlay} aria-hidden="true" />
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </section>
  )
}
