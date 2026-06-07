import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import ScrollIndicator from './ScrollIndicator'
import styles from './HeroBoard.module.css'

type Props = {
  title: string
  tagline?: string | null
  backgroundImage?: SanityImage | null
}

export default function HeroBoard({ title, tagline, backgroundImage }: Props) {
  return (
    <div className={styles.heroBoard}>
      <div className={styles.heroBoard__bg} aria-hidden="true">
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
      </div>

      <div className={styles.heroBoard__content}>
        <h1 className={styles.heroBoard__title}>{title}</h1>
        {tagline && <p className={styles.heroBoard__tagline}>{tagline}</p>}
      </div>

      <ScrollIndicator />
    </div>
  )
}
