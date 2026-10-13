import Image from 'next/image'
import styles from './BasicHero.module.css'

type Props = {
  title: string
  subtitle?: string
  imageUrl: string
  imageAlt?: string
}

/**
 * Full-bleed image hero with a centered title + optional subtitle (Figma 1422-1091).
 * The fixed header overlays the top transparently. Reusable across pages.
 */
export default function BasicHero({ title, subtitle, imageUrl, imageAlt = '' }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        {/* On mobile the hero is portrait-ish, so object-fit: cover crops by HEIGHT —
            100vw (a width hint) under-serves the candidate and the image looks blurry.
            Request the largest candidate there so the vertical crop stays sharp. */}
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 700px) 200vw, 100vw"
          className={styles.image}
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
