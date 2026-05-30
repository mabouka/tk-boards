import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, PortableTextValue, Cta } from '@/sanity/lib/types'
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
      data-halo
      data-halo-rgb="215, 215, 255"
      data-halo-opacity="0.23"
      data-halo-w="143vw"
      data-halo-h="46vh"
      data-halo-spread="11%"
      data-halo-anchor="top-right"
    >

      {/* ── Row 1 : eyebrow + titre animé ── */}
      {eyebrow && <p className={styles.aboutPreview__eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.aboutPreview__title}>{title}</h2>}

      {/* ── Row 2 : image + texte/CTA ── */}
      {image && (
        <div
          className={styles.aboutPreview__image}
          data-halo
          data-halo-rgb="215, 215, 255"
          data-halo-opacity="0.22"
          data-halo-w="87vw"
          data-halo-h="44vh"
          data-halo-spread="1%"
          data-halo-anchor="bottom-left"
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
