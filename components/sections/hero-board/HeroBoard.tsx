import { heroImageSrcSets, hasAsset } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
import styles from './HeroBoard.module.css'

type Props = {
  title: string
  tagline?: string | null
  backgroundImage?: SanityImage | null
}

// Full-screen (100svh) → the mobile box is a tall portrait (~375×812).
const MOBILE_RATIO = 812 / 375

export default function HeroBoard({ title, tagline, backgroundImage }: Props) {
  // Art direction: phones get a portrait crop around the hotspot (honours the
  // editorial crop + focal point via urlFor), desktop keeps the wide image. Only
  // the matching <source> is fetched, eagerly + high fetchpriority (hero = LCP).
  const sets = hasAsset(backgroundImage) ? heroImageSrcSets(backgroundImage, MOBILE_RATIO) : null

  return (
    <div className={styles.heroBoard}>
      <div className={styles.heroBoard__bg} aria-hidden="true">
        {sets && (
          <picture>
            <source media="(max-width: 700px)" srcSet={sets.mobileSrcSet} sizes="100vw" />
            <img
              src={sets.fallbackSrc}
              srcSet={sets.desktopSrcSet}
              sizes="100vw"
              alt=""
              className={styles.heroBoard__bg_image}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        )}
      </div>

      <div className={styles.heroBoard__content}>
        <h1 className={styles.heroBoard__title}>{title}</h1>
        {tagline && <p className={styles.heroBoard__tagline}>{tagline}</p>}
      </div>

      <ScrollIndicator className={styles.heroBoard__scroll} />
    </div>
  )
}
