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
        <Image src={imageUrl} alt={imageAlt} fill priority sizes="100vw" className={styles.image} />
        <div className={styles.overlay} aria-hidden="true" />
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </section>
  )
}
