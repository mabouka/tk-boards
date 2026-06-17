import { PortableText } from 'next-sanity'
import type { SanityImage, PortableTextValue } from '@/sanity/lib/types'
import styles from './ProductPresentation.module.css'
import ProductGallery from './ProductGallery'
import BuyCta from '@/components/configurator/BuyCta'
import type { StorefrontProduct } from '@/lib/storefront/product'

export type PresentationNumber = { value: string; unit?: string | null; label: string }
export type PresentationTag = { text: string; style?: string | null }
export type PresentationSpec = { name?: string | null; value?: string | null }

type Props = {
  sectionLabel?: string
  title?: string | null
  text?: PortableTextValue | null
  numbers?: PresentationNumber[]
  tags?: PresentationTag[]
  specifications?: PresentationSpec[]
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
  productName: string
  /** Which side the gallery sits on. Defaults to 'right'. */
  imageSide?: 'left' | 'right'
  /** When this is the first element on the page (no hero above), add top padding to clear the fixed header. */
  atPageTop?: boolean
}

export default function ProductPresentation({
  sectionLabel,
  title,
  text,
  numbers = [],
  tags = [],
  specifications = [],
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
  productName,
  imageSide = 'right',
  atPageTop = false,
}: Props) {
  const isImageLeft = imageSide === 'left'
  const sectionClass = [
    styles.productPresentation,
    isImageLeft && styles['productPresentation--imageLeft'],
    atPageTop && styles['productPresentation--atPageTop'],
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={sectionClass}
      data-halo
      data-halo-rgb="215, 215, 255"
      data-halo-opacity="0.10"
      data-halo-w="250vw"
      data-halo-h="200vh"
      data-halo-spread="1%"
      data-halo-anchor="bottom-left">
      {/* Gallery first in the DOM when it sits on the left (client island: zoomable lightbox) */}
      {isImageLeft && <ProductGallery images={gallery} productName={productName} />}

      {/* Sticky info panel */}
      <div className={styles.productPresentation__left}
        data-halo
        data-halo-rgb="215, 215, 255"
        data-halo-opacity="0.10"
        data-halo-w="250vw"
        data-halo-h="200vh"
        data-halo-spread="1%"
        data-halo-anchor="top-left">
        {sectionLabel && (
          <>
            <span className={styles.productPresentation__label}>{sectionLabel}</span>
            <div className={styles.productPresentation__rule} />
          </>
        )}

        {title && (
          <h2 className={styles.productPresentation__headline}>{title}</h2>
        )}

        {tags.length > 0 && (
          <div className={styles.productPresentation__tags}>
            {tags.map((tag, i) => (
              <span key={i} className={`u-tag u-tag--large u-tag--${tag.style ?? 'outline-light'}`}>
                {tag.text}
              </span>
            ))}
          </div>
        )}

        {text && (
          <div className={styles.productPresentation__description}>
            <PortableText value={text} />
          </div>
        )}

        {numbers.length > 0 && (
          <div className={styles.productPresentation__specs}>
            {numbers.map((num, i) => (
              <div key={i} className={styles.productPresentation__spec}>
                <div className={styles.productPresentation__specValue}>
                  {num.value}
                  {num.unit && (
                    <span className={styles.productPresentation__specUnit}> {num.unit}</span>
                  )}
                </div>
                <span className={styles.productPresentation__specLabel}>{num.label}</span>
              </div>
            ))}
          </div>
        )}

        {specifications.length > 0 && (
          <dl className={styles.productPresentation__specList}>
            {specifications.map((spec, i) => (
              <div key={i} className={styles.productPresentation__specListRow}>
                <dt className={styles.productPresentation__specListName}>{spec.name}</dt>
                <dd className={styles.productPresentation__specListValue}>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className={styles.productPresentation__ctas}>
          <BuyCta
            product={product}
            locale={locale}
            productName={productName}
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

        {false && (
          <ul className={styles.productPresentation__perks}>
            {perks.map((perk, i) => (
              <li key={i} className={styles.productPresentation__perk}>{perk}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Gallery on the right (default) */}
      {!isImageLeft && <ProductGallery images={gallery} productName={productName} />}
    </section>
  )
}
