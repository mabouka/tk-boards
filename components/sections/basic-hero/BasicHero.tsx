import styles from './BasicHero.module.css'

type Props = {
  title: string
  subtitle?: string
  imageUrl: string
  imageAlt?: string
}

// Portrait crop ratio for the mobile hero: 375 × 466 (what the design asks for).
const MOBILE_RATIO = 466 / 375
const MOBILE_WIDTHS = [375, 640, 750, 828, 1080, 1200]
const DESKTOP_WIDTHS = [828, 1080, 1200, 1536, 1920]

// Build a Sanity CDN variant of `url`: resize to `w`, and when `h` is given also
// crop to that box (fit=crop) — the original ?q=…&auto=format are preserved. A
// non-Sanity src (local sample fallback) can't be transformed, so it passes through.
function variant(url: string, w: number, h?: number): string {
  try {
    const u = new URL(url)
    const p = u.searchParams
    p.set('w', String(w))
    if (h) {
      p.set('h', String(h))
      p.set('fit', 'crop')
    } else {
      p.delete('h')
      p.delete('fit')
    }
    return u.toString()
  } catch {
    return url
  }
}

const srcSet = (url: string, widths: number[], portrait: boolean) =>
  widths.map((w) => `${variant(url, w, portrait ? Math.round(w * MOBILE_RATIO) : undefined)} ${w}w`).join(', ')

/**
 * Full-bleed image hero with a centered title + optional subtitle (Figma 1422-1091).
 * The fixed header overlays the top transparently. Reusable across pages.
 *
 * Art direction via <picture>: phones (≤700px) get a 375×466 portrait CROP of the
 * source (≈750×932 @2×, ~10× lighter than the landscape), desktops get the wide
 * image. The browser downloads only the matching <source> — eagerly + high
 * fetchpriority, since the hero is the LCP element. object-fit:cover on a landscape
 * source used to upscale (blur) on the tall mobile box; the real crop fixes that.
 */
export default function BasicHero({ title, subtitle, imageUrl, imageAlt = '' }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <picture>
          <source media="(max-width: 700px)" srcSet={srcSet(imageUrl, MOBILE_WIDTHS, true)} sizes="100vw" />
          <img
            src={variant(imageUrl, 1920)}
            srcSet={srcSet(imageUrl, DESKTOP_WIDTHS, false)}
            sizes="100vw"
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
