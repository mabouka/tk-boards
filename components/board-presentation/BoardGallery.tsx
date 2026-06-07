'use client'

import { useState } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import styles from './BoardPresentation.module.css'

type GalleryImage = SanityImage & { alt?: string | null }

export default function BoardGallery({
  images,
  boardName,
}: {
  images: GalleryImage[]
  boardName: string
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // High-res slides for the lightbox (zoom needs detail). Served straight by Sanity.
  const slides = images.map((img) => ({
    src: urlFor(img).width(2000).quality(90).url(),
    alt: img.alt ?? boardName,
  }))

  return (
    <>
      <div className={styles.boardPresentation__right}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={styles.boardPresentation__galleryItem}
            onClick={() => {
              setIndex(i)
              setOpen(true)
            }}
            aria-label={`Agrandir : ${img.alt ?? boardName}`}
            data-halo
            data-halo-rgb="215, 215, 255"
            data-halo-opacity="0.20"
            data-halo-w="56vw"
            data-halo-h="76vh"
          >
            <Image
              src={urlFor(img).width(900).height(900).quality(85).url()}
              alt={img.alt ?? boardName}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

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
    </>
  )
}
