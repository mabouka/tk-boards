import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './AccessoryCard.module.css'

// Glow behind each accessory card (BgHalos reads these data-* attributes).
const cardHalo = haloProps({ rgb: '225, 255, 255', opacity: 0.28, w: '28vw', h: '43vh', spread: '1%' })

type Props = {
  /** Locale-relative path, e.g. `/accessories/tk-board-bag`. */
  href: string
  name: string
  imageUrl?: string | null
  /** Category label shown on the tag (top-left). */
  categoryName?: string | null
}

/** Square accessory card — image, category tag (top-left) and centered name. */
export default function AccessoryCard({ href, name, imageUrl, categoryName }: Props) {
  return (
    <Link href={href} className={styles.card} aria-label={name} {...cardHalo}>
      {imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={name}
            fill
            className={styles.card_img}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw"
          />
          <div className={styles.card_overlay} aria-hidden="true" />
        </>
      )}
      {categoryName && (
        <div className={styles.card_meta}>
          <span className={`${styles.card_tag} u-tag--cream`}>{categoryName}</span>
        </div>
      )}
      <span className={styles.card_name}>{name}</span>
    </Link>
  )
}
