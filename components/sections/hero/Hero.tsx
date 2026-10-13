import HeroPicture from '../_shared/HeroPicture'
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
  return (
    <div className={styles.hero}>

      <div className={styles.hero__bg} aria-hidden="true">
        <HeroPicture image={backgroundImage} mobileRatio={MOBILE_RATIO} className={styles.hero__bg_image} />
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
