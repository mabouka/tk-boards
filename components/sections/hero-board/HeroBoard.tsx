import HeroPicture from '../_shared/HeroPicture'
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
  return (
    <div className={styles.heroBoard}>
      <div className={styles.heroBoard__bg} aria-hidden="true">
        <HeroPicture image={backgroundImage} mobileRatio={MOBILE_RATIO} className={styles.heroBoard__bg_image} />
      </div>

      <div className={styles.heroBoard__content}>
        <h1 className={styles.heroBoard__title}>{title}</h1>
        {tagline && <p className={styles.heroBoard__tagline}>{tagline}</p>}
      </div>

      <ScrollIndicator className={styles.heroBoard__scroll} />
    </div>
  )
}
