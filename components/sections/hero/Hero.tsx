import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
import styles from './Hero.module.css'

type HeroProps = {
  title: string
  subtitle: string
  backgroundImage?: SanityImage
}

export default function Hero({ title, subtitle, backgroundImage }: HeroProps) {
  return (
    <div className={styles.hero}>

      <div className={styles.hero__bg} aria-hidden="true">
        {backgroundImage && (
          <Image
            src={urlFor(backgroundImage).width(1920).url()}
            alt=""
            fill
            quality={85}
            priority
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="100vw"
          />
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
