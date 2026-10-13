import { heroImageSrcSets, hasAsset } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
import styles from './Hero.module.css'

type HeroProps = {
  title: string
  subtitle: string
  backgroundImage?: SanityImage
}

// This hero is full-screen (100svh), so the mobile box is a tall portrait (~375×812).
const MOBILE_RATIO = 812 / 375

export default function Hero({ title, subtitle, backgroundImage }: HeroProps) {
  // Art direction: phones get a portrait crop around the hotspot (honours the
  // editorial crop + focal point via urlFor), desktop keeps the wide image. Only
  // the matching <source> is fetched, eagerly + high fetchpriority (hero = LCP).
  const sets = hasAsset(backgroundImage) ? heroImageSrcSets(backgroundImage, MOBILE_RATIO) : null

  return (
    <div className={styles.hero}>

      <div className={styles.hero__bg} aria-hidden="true">
        {sets && (
          <picture>
            <source media="(max-width: 700px)" srcSet={sets.mobileSrcSet} sizes="100vw" />
            <img
              src={sets.fallbackSrc}
              srcSet={sets.desktopSrcSet}
              sizes="100vw"
              alt=""
              className={styles.hero__bg_image}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        )}
        <div className={styles.hero__overlay} />
      </div>

      <div className={styles.hero__content}>
        <h1 className={styles.hero__title}>{title}</h1>
        <p className={styles.hero__subtitle}>{subtitle}</p>
      </div>

      <ScrollIndicator className={styles.hero__scroll} />

    </div>
  )
}
