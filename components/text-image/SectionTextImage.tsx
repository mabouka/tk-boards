import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import styles from './SectionTextImage.module.css'

type SanityImage = { _type: string; asset: { _ref: string } }
type Cta = { _key?: string; text?: string; href?: string; openInNewTab?: boolean }

type Props = {
  label?: string
  title: string
  body?: any[]
  image?: SanityImage
  ctas?: Cta[]
  theme?: 'light' | 'dark'
  imagePosition?: 'left' | 'right'
  layout?: 'full' | 'contained'
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
}: Props) {
  const isDark      = theme === 'dark'
  const isReverse   = imagePosition === 'right'
  const isContained = layout === 'contained'

  const classList = [
    styles.textImage,
    isDark      ? styles['textImage--dark']      : '',
    isReverse   ? styles['textImage--reverse']   : '',
    isContained ? styles['textImage--contained'] : '',
  ].filter(Boolean).join(' ')

  const ctaVariant = isDark ? 'u-cta--white-outline' : 'u-cta--black-outline'

  const imageEl = image && (
    <div className={styles.textImage__image}>
      <Image
        src={urlFor(image).width(1800).quality(85).url()}
        alt={title}
        fill
        sizes={isContained ? '45vw' : '57vw'}
      />
    </div>
  )

  return (
    <section
      className={classList}
      {...(isDark ? {
        'data-halo': '',
        'data-halo-rgb': '212, 172, 251',
        'data-halo-opacity': '0.28',
        'data-halo-w': '61vw',
        'data-halo-h': '39vh',
        'data-halo-spread': '29%',
      } : {})}
    >
      {isContained
        ? image && <div className={styles.textImage__imageOuter}>{imageEl}</div>
        : imageEl
      }

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
            {ctas.map((cta, i) => cta.href && cta.text && (
              <a
                key={cta._key ?? i}
                href={cta.href}
                className={`${styles.textImage__cta} u-cta ${ctaVariant}`}
                {...(cta.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {cta.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
