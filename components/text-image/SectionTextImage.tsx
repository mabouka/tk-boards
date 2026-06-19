import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, PortableTextValue, Cta } from '@/sanity/lib/types'
import { haloProps } from '@/components/halo/haloProps'
import styles from './SectionTextImage.module.css'

// Natural W×H encoded in the Sanity asset ref: image-<id>-<w>x<h>-<ext>
function refRatio(src?: SanityImage): string | undefined {
  const ref = (src as unknown as { asset?: { _ref?: string } })?.asset?._ref ?? ''
  const m = ref.match(/-(\d+)x(\d+)-/)
  return m ? `${m[1]} / ${m[2]}` : undefined
}

type Props = {
  label?: string
  title: string
  body?: PortableTextValue
  image?: SanityImage
  ctas?: Cta[]
  theme?: 'light' | 'dark'
  imagePosition?: 'left' | 'right'
  layout?: 'full' | 'contained'
  /** Optional forced image ratio (e.g. "1 / 1", "4 / 3"); empty = natural. */
  aspectRatio?: string
}

export default function SectionTextImage({
  label,
  title,
  body,
  image,
  ctas,
  theme = 'light',
  imagePosition = 'left',
  layout = 'full',
  aspectRatio,
}: Props) {
  const isDark = theme === 'dark'
  const isContained = layout === 'contained'

  const classList = [
    styles.textImage,
    styles[`textImage--${layout}`],
    isDark ? styles['textImage--dark'] : '',
    imagePosition === 'right' ? styles['textImage--reverse'] : '',
  ]
    .filter(Boolean)
    .join(' ')

  // First CTA is the primary (filled), the rest are outlined.
  const ctaFill = isDark ? 'u-cta--white-fill' : 'u-cta--black-fill'
  const ctaOutline = isDark ? 'u-cta--white-outline' : 'u-cta--black-outline'

  return (
    <section
      className={classList}
      {...(isDark
        ? haloProps({ rgb: '225, 255, 255', opacity: 0.25, w: '60vw', h: '40vh', spread: '29%' })
        : {})}
    >
      {image && (
        <div
          className={styles.textImage__image}
          style={
            aspectRatio || isContained
              ? { aspectRatio: aspectRatio || refRatio(image) }
              : undefined
          }
        >
          <Image
            src={urlFor(image).width(1200).quality(85).url()}
            alt={title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      )}

      <div className={styles.textImage__content}>
        {label && <span className={styles.textImage__eyebrow}>{label}</span>}
        <h2 className={styles.textImage__title}>{title}</h2>
        {body && (
          <div className={styles.textImage__body}>
            <PortableText value={body} />
          </div>
        )}
        {ctas && ctas.length > 0 && (
          <div className={styles.textImage__ctas}>
            {ctas.map((cta, i) =>
              cta.href && cta.text ? (
                <a
                  key={cta._key ?? i}
                  href={cta.href}
                  className={`u-cta ${i === 0 ? ctaFill : ctaOutline}`}
                  {...(cta.openInNewTab
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {cta.text}
                </a>
              ) : null
            )}
          </div>
        )}
      </div>
    </section>
  )
}
