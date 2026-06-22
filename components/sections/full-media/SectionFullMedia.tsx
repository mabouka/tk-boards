import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
import FullMediaVideo from './FullMediaVideo'
import styles from './SectionFullMedia.module.css'

type Props = {
  mediaType?: 'image' | 'video' | null
  image?: (SanityImage & { alt?: string | null }) | null
  videoUrl?: string | null
  videoPoster?: SanityImage | null
  videoWidth?: number | null
  videoHeight?: number | null
  controls?: boolean | null
  size?: 'full' | 'in-grid' | null
}

// Natural W×H encoded in the Sanity asset ref: image-<id>-<w>x<h>-<ext>
function refRatio(src?: SanityImage | null): string | undefined {
  const ref = (src as unknown as { asset?: { _ref?: string } })?.asset?._ref ?? ''
  const m = ref.match(/-(\d+)x(\d+)-/)
  return m ? `${m[1]} / ${m[2]}` : undefined
}

export default function SectionFullMedia({
  mediaType,
  image,
  videoUrl,
  videoPoster,
  videoWidth,
  videoHeight,
  controls,
  size = 'full',
}: Props) {
  // Video: ratio from the entered pixel dimensions. Image: its natural ratio.
  const ratio =
    mediaType === 'video'
      ? videoWidth && videoHeight
        ? `${videoWidth} / ${videoHeight}`
        : '16 / 9'
      : (refRatio(image) ?? '16 / 9')

  const poster = videoPoster ? urlFor(videoPoster).width(1920).quality(80).url() : undefined

  const classList = [styles.fullMedia, size === 'in-grid' ? styles['fullMedia--inGrid'] : '']
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={classList} style={{ aspectRatio: ratio }}>
      {mediaType === 'video' && videoUrl ? (
        <FullMediaVideo src={videoUrl} poster={poster} controls={controls ?? undefined} />
      ) : image ? (
        <Image
          className={styles.fullMedia__media}
          src={urlFor(image).width(1920).quality(85).url()}
          alt={image.alt ?? ''}
          fill
          sizes="100vw"
        />
      ) : null}
    </figure>
  )
}
