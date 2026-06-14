import { PortableText } from 'next-sanity'
import type { SanityImage, PortableTextValue } from '@/sanity/lib/types'
import styles from './BoardPresentation.module.css'
import BoardGallery from './BoardGallery'
import BuyCta from '@/components/configurator/BuyCta'
import type { StorefrontProduct } from '@/lib/storefront/product'

export type PresentationNumber = { value: string; unit?: string | null; label: string }
export type PresentationTag = { text: string; style?: string | null }

type Props = {
  sectionLabel: string
  title?: string | null
  text?: PortableTextValue | null
  numbers?: PresentationNumber[]
  tags?: PresentationTag[]
  buyLabel: string
  cartLabel: string
  configureLabel: string
  fromLabel: string
  cartStubLabel: string
  closeLabel: string
  product: StorefrontProduct | null
  locale: string
  previewImage: string | null
  perks: string[]
  gallery: (SanityImage & { alt?: string | null })[]
  boardName: string
}

export default function BoardPresentation({
  sectionLabel,
  title,
  text,
  numbers = [],
  tags = [],
  buyLabel,
  cartLabel,
  configureLabel,
  fromLabel,
  cartStubLabel,
  closeLabel,
  product,
  locale,
  previewImage,
  perks,
  gallery,
  boardName,
}: Props) {
  return (
    <section className={styles.boardPresentation}
      data-halo
      data-halo-rgb="215, 215, 255"
      data-halo-opacity="0.10"
      data-halo-w="250vw"
      data-halo-h="200vh"
      data-halo-spread="1%"
      data-halo-anchor="bottom-left">
      {/* Left — sticky info panel */}
      <div className={styles.boardPresentation__left}
        data-halo
        data-halo-rgb="215, 215, 255"
        data-halo-opacity="0.10"
        data-halo-w="250vw"
        data-halo-h="200vh"
        data-halo-spread="1%"
        data-halo-anchor="top-left">
        <span className={styles.boardPresentation__label}>{sectionLabel}</span>
        <div className={styles.boardPresentation__rule} />

        {title && (
          <h2 className={styles.boardPresentation__headline}>{title}</h2>
        )}

        {tags.length > 0 && (
          <div className={styles.boardPresentation__tags}>
            {tags.map((tag, i) => (
              <span key={i} className={`u-tag u-tag--large u-tag--${tag.style ?? 'outline-light'}`}>
                {tag.text}
              </span>
            ))}
          </div>
        )}

        {text && (
          <div className={styles.boardPresentation__description}>
            <PortableText value={text} />
          </div>
        )}

        {numbers.length > 0 && (
          <div className={styles.boardPresentation__specs}>
            {numbers.map((num, i) => (
              <div key={i} className={styles.boardPresentation__spec}>
                <div className={styles.boardPresentation__specValue}>
                  {num.value}
                  {num.unit && (
                    <span className={styles.boardPresentation__specUnit}> {num.unit}</span>
                  )}
                </div>
                <span className={styles.boardPresentation__specLabel}>{num.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.boardPresentation__ctas}>
          <BuyCta
            product={product}
            locale={locale}
            previewImage={previewImage}
            labels={{
              buy: buyLabel,
              cart: cartLabel,
              configure: configureLabel,
              from: fromLabel,
              cartStub: cartStubLabel,
              close: closeLabel,
            }}
          />
        </div>

        <ul className={styles.boardPresentation__perks}>
          {perks.map((perk, i) => (
            <li key={i} className={styles.boardPresentation__perk}>{perk}</li>
          ))}
        </ul>
      </div>

      {/* Right — scrolling gallery (client island: opens a zoomable lightbox) */}
      <BoardGallery images={gallery} boardName={boardName} />
    </section>
  )
}
