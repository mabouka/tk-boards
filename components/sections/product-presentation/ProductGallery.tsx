'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './ProductPresentation.module.css'

type GalleryImage = SanityImage & { alt?: string | null }

export default function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[]
  productName: string
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  // Mobile slider: track which slide is centred so the dots can reflect it.
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const onScroll = () => {
    const el = trackRef.current
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth))
  }
  const goTo = (i: number) => {
    const el = trackRef.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  // High-res slides for the lightbox (zoom needs detail). Served straight by Sanity.
  const slides = images.map((img) => ({
    src: urlFor(img).width(2000).quality(90).url(),
    alt: img.alt ?? productName,
  }))

  return (
    <>
      <div ref={trackRef} className={styles.productPresentation__right} onScroll={onScroll}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={styles.productPresentation__galleryItem}
            onClick={() => {
              setIndex(i)
              setOpen(true)
            }}
            aria-label={`Agrandir : ${img.alt ?? productName}`}
            {...haloProps({ rgb: '215, 215, 255', opacity: 0.2, w: '56vw', h: '76vh' })}
          >
            <Image
              src={urlFor(img).width(900).height(900).quality(85).url()}
              alt={img.alt ?? productName}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

      {/* Slider position — mobile only (hidden by CSS on desktop), 2+ images. */}
      {images.length > 1 && (
        <div className={styles.productPresentation__dots} role="tablist" aria-label={productName}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={styles.productPresentation__dot}
              data-active={i === active}
              aria-label={`Image ${i + 1}`}
              aria-selected={i === active}
              role="tab"
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}

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
