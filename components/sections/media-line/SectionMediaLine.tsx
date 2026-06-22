'use client'

import { useState } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import FullMediaVideo from '@/components/sections/full-media/FullMediaVideo'
import styles from './SectionMediaLine.module.css'

type MediaItem = {
  _key?: string
  mediaType?: 'image' | 'video' | null
  image?: (SanityImage & { alt?: string | null }) | null
  videoUrl?: string | null
  videoPoster?: SanityImage | null
  controls?: boolean | null
}

type ImageItem = MediaItem & { image: SanityImage & { alt?: string | null } }

type Props = {
  media?: MediaItem[] | null
  aspectRatio?: string | null
  size?: 'full' | 'in-grid' | null
}

export default function SectionMediaLine({ media, aspectRatio, size = 'in-grid' }: Props) {
  const items = media ?? []
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  if (items.length === 0) return null

  const ratio = aspectRatio ?? '4 / 3'
  const classList = [styles.mediaLine, size === 'full' ? styles['mediaLine--full'] : '']
    .filter(Boolean)
    .join(' ')

  // Image items become the lightbox slides (videos play inline, not zoomed).
  const imageItems = items.filter(
    (it): it is ImageItem => it.mediaType !== 'video' && Boolean(it.image)
  )
  const slides = imageItems.map((it) => ({
    src: urlFor(it.image).width(2000).quality(90).url(),
    alt: it.image.alt ?? '',
  }))

  return (
    <>
      <div className={classList}>
        {items.map((item, i) => {
          const key = item._key ?? i

          if (item.mediaType === 'video' && item.videoUrl) {
            return (
              <figure key={key} className={styles.mediaLine__item} style={{ aspectRatio: ratio }}>
                <FullMediaVideo
                  src={item.videoUrl}
                  poster={
                    item.videoPoster
                      ? urlFor(item.videoPoster).width(1200).quality(80).url()
                      : undefined
                  }
                  controls={item.controls ?? undefined}
                />
              </figure>
            )
          }

          if (!item.image) return null

          return (
            <button
              key={key}
              type="button"
              className={`${styles.mediaLine__item} ${styles['mediaLine__item--button']}`}
              style={{ aspectRatio: ratio }}
              onClick={() => {
                setIndex(imageItems.indexOf(item as ImageItem))
                setOpen(true)
              }}
              aria-label={`Agrandir : ${item.image.alt ?? 'image'}`}
            >
              <Image
                className={styles.mediaLine__media}
                src={urlFor(item.image).width(1200).quality(85).url()}
                alt={item.image.alt ?? ''}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </button>
          )
        })}
      </div>

      {slides.length > 0 && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={index}
          slides={slides}
          plugins={[Zoom]}
          zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
          carousel={{ finite: true }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </>
  )
}
