import Image from 'next/image'
import styles from './WorkshopSection.module.css'

type Props = {
  eyebrow?: string
  title: string
  body?: string
  mapsUrl?: string
  mapsLabel?: string
  imageUrl: string
  imageAlt?: string
  theme?: 'light' | 'dark'
  cardSide?: 'left' | 'right'
}

/**
 * Full-screen background image with a text card overlaid on top (Figma 740-1412).
 * Card aligns to the 12-col grid; light/dark theme and left/right card variants.
 */
export default function WorkshopSection({
  eyebrow,
  title,
  body,
  mapsUrl,
  mapsLabel = 'View on Maps',
  imageUrl,
  imageAlt = '',
  theme = 'light',
  cardSide = 'right',
}: Props) {
  const isDark = theme === 'dark'

  const classList = [
    styles.workshop,
    isDark ? styles['workshop--dark'] : '',
    cardSide === 'left' ? styles['workshop--left'] : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classList}>
      <div className={styles.image}>
        <Image src={imageUrl} alt={imageAlt} fill sizes="100vw" />
      </div>

      <div className={styles.card}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
        {body && <p className={styles.body}>{body}</p>}
        {mapsUrl && (
          <a
            className={`u-cta ${isDark ? 'u-cta--white-fill' : 'u-cta--black-fill'}`}
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {mapsLabel}
          </a>
        )}
      </div>
    </section>
  )
}
