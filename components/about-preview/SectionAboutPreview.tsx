import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import styles from './SectionAboutPreview.module.css'

type Props = {
  eyebrow?: string
  title?: string
  image?: any
  body?: any[]
  cta?: { text?: string; href?: string; openInNewTab?: boolean }
}

export default function SectionAboutPreview({ eyebrow, title, image, body, cta }: Props) {
  return (
    <section className={styles.aboutPreview}>

      {/* ── Row 1 : eyebrow + titre animé ── */}
      {eyebrow && <p className={styles.aboutPreview__eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.aboutPreview__title}>{title}</h2>}

      {/* ── Row 2 : image + texte/CTA ── */}
      {image && (
        <div className={styles.aboutPreview__image}>
          <Image
            src={urlFor(image).width(800).url()}
            alt=""
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="25vw"
          />
        </div>
      )}

      <div className={styles.aboutPreview__aside}>
        {body && (
          <div className={styles.aboutPreview__body}>
            <PortableText value={body} />
          </div>
        )}
        {cta?.href && (
          <a
            href={cta.href}
            className={`u-cta u-cta--white-outline ${styles.aboutPreview__cta}`}
            target={cta.openInNewTab ? '_blank' : undefined}
            rel={cta.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            {cta.text ?? 'Discover our story'}
          </a>
        )}
      </div>

    </section>
  )
}
