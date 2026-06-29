import type { HTMLAttributes } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import styles from './BoardCard.module.css'

type Props = {
  /** Locale-relative path, e.g. `/boards/rocket`. */
  href: string
  name: string
  imageUrl?: string | null
  /** Short series label shown on the first tag. */
  seriesName?: string | null
  tagVariant?: string | null
  style?: string | null
  viewBoardLabel: string
  /** next/image sizes hint; defaults to a responsive 3-up grid. */
  sizes?: string
  /** Optional BgHalos `data-halo*` attributes (from haloProps) to glow this card. */
  halo?: HTMLAttributes<HTMLElement>
}

/**
 * Board card — the dark image card with a series tag, style tag, name and a
 * "view board" CTA, centered. Shared by the home BoardsPreview (horizontal
 * scroll) and the /boards page (grid); the parent controls the width.
 */
export default function BoardCard({
  href,
  name,
  imageUrl,
  seriesName,
  tagVariant,
  style,
  viewBoardLabel,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw',
  halo,
}: Props) {
  return (
    <Link href={href} className={styles.card} aria-label={`${name}${style ? ` — ${style}` : ''}`} {...halo}>
      {imageUrl && (
        <Image src={imageUrl} alt={name} fill quality={85} className={styles.card_img} sizes={sizes} />
      )}
      <div className={styles.card_overlay} aria-hidden="true" />
      <span className={styles.card_name}>{name}</span>
      <div className={styles.card_meta}>
        {seriesName && (
          <span className={`${styles.card_tag} u-tag--${tagVariant ?? 'dark'}`}>{seriesName}</span>
        )}
        {style && <span className={`${styles.card_tag} u-tag--cream`}>{style}</span>}
      </div>
      <span className={styles.card_cta}>{viewBoardLabel}</span>
    </Link>
  )
}
