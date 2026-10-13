import styles from './BasicHero.module.css'
import HeroPicture from '../_shared/HeroPicture'

type Props = {
  title: string
  subtitle?: string
  /** The Sanity image object (asset + crop + hotspot) — not a pre-resolved URL. */
  image?: { asset?: unknown } | null
  imageAlt?: string
  /** Shown when the field has no uploaded asset. */
  fallbackUrl?: string
}

// Portrait crop ratio for the mobile hero: 375 × 466 (what the design asks for).
const MOBILE_RATIO = 466 / 375

/**
 * Full-bleed image hero with a centered title + optional subtitle (Figma 1422-1091).
 * The fixed header overlays the top transparently. Reusable across pages.
 * The background art direction (mobile crop + LCP preload) lives in <HeroPicture>.
 */
export default function BasicHero({
  title,
  subtitle,
  image,
  imageAlt = '',
  fallbackUrl = '/samples/channel.jpg',
}: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <HeroPicture
          image={image}
          alt={imageAlt}
          mobileRatio={MOBILE_RATIO}
          className={styles.image}
          fallbackUrl={fallbackUrl}
        />
        <div className={styles.overlay} aria-hidden="true" />
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </section>
  )
}
