import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, PortableTextValue, Cta } from '@/sanity/lib/types'
import { haloProps } from '@/components/halo/haloProps'
import styles from './SectionAboutPreview.module.css'

type Props = {
  eyebrow?: string
  title?: string
  image?: SanityImage
  body?: PortableTextValue
  cta?: Cta
}

export default function SectionAboutPreview({ eyebrow, title, image, body, cta }: Props) {
  return (
    <section
      className={styles.aboutPreview}
      {...haloProps({ rgb: '215, 215, 255', opacity: 0.23, w: '143vw', h: '46vh', spread: '11%', anchor: 'top-right' })}
    >

      {/* ── Row 1 : eyebrow + titre animé ── */}
      {eyebrow && <p className={styles.aboutPreview__eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.aboutPreview__title}>{title}</h2>}

      {/* ── Row 2 : image + texte/CTA ── */}
      {image && (
        <div
          className={styles.aboutPreview__image}
          {...haloProps({ rgb: '215, 215, 255', opacity: 0.22, w: '87vw', h: '44vh', spread: '1%', anchor: 'bottom-left' })}
        >
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
