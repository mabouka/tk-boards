'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, PortableTextValue } from '@/sanity/lib/types'
import styles from './SectionTextGallery.module.css'

type GalleryImage = SanityImage & { alt?: string | null }

type Props = {
  label?: string
  title: string
  body?: PortableTextValue
  gallery: GalleryImage[]
  theme?: 'light' | 'dark'
  imagePosition?: 'left' | 'right'
}

export default function SectionTextGallery({
  label,
  title,
  body,
  gallery,
  theme = 'light',
  imagePosition = 'left',
}: Props) {
  const [active, setActive] = useState(0)

  const isDark = theme === 'dark'
  const isReverse = imagePosition === 'right'

  const classList = [
    styles.textGallery,
    isDark ? styles['textGallery--dark'] : '',
    isReverse ? styles['textGallery--reverse'] : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classList}>
      {/* Main image — all slides stacked, crossfaded via opacity on active change */}
      <div className={styles.textGallery__image}
        {...(isDark
          ? {
            'data-halo': '',
            'data-halo-rgb': '225, 225, 255',
            'data-halo-opacity': '0.30',
            'data-halo-w': '83vw',
            'data-halo-h': '60vh',
            'data-halo-spread': '5%',
          }
          : {})}
      >
        {gallery.map((img, i) => (
          <Image
            key={i}
            src={urlFor(img).width(1080).height(720).quality(85).url()}
            alt={img.alt ?? title}
            fill
            sizes="(min-width: 1024px) 62vw, 100vw"
            priority={i === 0}
            className={[
              styles.textGallery__slide,
              i === active ? styles['textGallery__slide--active'] : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>

      {/* Content — stays the same regardless of the active image */}
      <div className={styles.textGallery__content}>
        {label && <span className={styles.textGallery__eyebrow}>{label}</span>}
        <h2 className={styles.textGallery__title}>{title}</h2>
        {body && (
          <div className={styles.textGallery__body}>
            <PortableText value={body} />
          </div>
        )}

        {gallery.length > 1 && (
          <div className={styles.textGallery__thumbs} role="tablist" aria-label={title}>
            {gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={img.alt ?? `Image ${i + 1}`}
                className={[
                  styles.textGallery__thumb,
                  i === active ? styles['textGallery__thumb--active'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActive(i)}
              >
                <Image
                  src={urlFor(img).width(100).height(100).quality(80).url()}
                  alt=""
                  width={100}
                  height={100}
                />

              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
