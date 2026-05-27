import Image from 'next/image'
import { PortableText } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import styles from './SectionTextImageFull.module.css'

type SanityImage = { _type: string; asset: { _ref: string } }
type Cta = { text?: string; href?: string; openInNewTab?: boolean }

type Props = {
  label?: string
  title: string
  body?: any[]
  image?: SanityImage
  cta?: Cta
  theme?: 'light' | 'dark'
  imagePosition?: 'left' | 'right'
}

export default function SectionTextImageFull({
  label,
  title,
  body,
  image,
  cta,
  theme = 'light',
  imagePosition = 'left',
}: Props) {
  const isDark    = theme === 'dark'
  const isReverse = imagePosition === 'right'

  const classList = [
    styles.textImageFull,
    isDark    ? styles['textImageFull--dark']    : '',
    isReverse ? styles['textImageFull--reverse'] : '',
  ].filter(Boolean).join(' ')

  const ctaVariant = isDark ? 'u-cta--white-outline' : 'u-cta--black-outline'

  return (
    <section className={classList}>
      {image && (
        <div className={styles.textImageFull__image}>
          <Image
            src={urlFor(image).width(1800).quality(85).url()}
            alt={title}
            fill
            sizes="57vw"
          />
        </div>
      )}

      <div className={styles.textImageFull__content}>
        {label && <span className={styles.textImageFull__eyebrow}>{label}</span>}
        <h2 className={styles.textImageFull__title}>{title}</h2>
        {body && (
          <div className={styles.textImageFull__body}>
            <PortableText value={body} />
          </div>
        )}
        {cta?.href && cta?.text && (
          <a
            href={cta.href}
            className={`${styles.textImageFull__cta} u-cta ${ctaVariant}`}
            {...(cta.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta.text}
          </a>
        )}
      </div>
    </section>
  )
}
