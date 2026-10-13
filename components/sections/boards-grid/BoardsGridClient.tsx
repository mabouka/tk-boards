'use client'

import { useEffect, useState } from 'react'
import AccessoryCard from '../accessories/AccessoryCard'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from '../accessories/Accessories.module.css'

// Glow behind the page title (matches the accessories listing).
const titleHalo = haloProps({ rgb: '225, 225, 255', opacity: 0.26, w: '67vw', h: '32vh', spread: '1%' })

type Series = { id: string; name: string | null; slug: string | null }
type Board = {
  _id: string
  name: string
  slug: string
  imageUrl: string | null
  seriesName: string | null
  seriesSlug: string | null
}

type Props = {
  title: string
  allLabel: string
  showFilters?: boolean
  series: Series[]
  boards: Board[]
}

/**
 * Boards listing — same layout as the accessories page (title, tab filters,
 * square-card grid), but the cards are boards and the filter is by series
 * ("Tout" + each series, e.g. Carbon Series / Wood Series). Reuses the square
 * AccessoryCard + Accessories.module.css so the two pages stay visually identical.
 */
export default function BoardsGridClient({ title, allLabel, showFilters = true, series, boards }: Props) {
  const [active, setActive] = useState<string>('all')
  const filtered = active === 'all' ? boards : boards.filter((b) => b.seriesSlug === active)

  // Filtering adds/removes [data-halo] cards → tell the global BgHalos layer to
  // recompute (same pattern as AccessoriesClient).
  useEffect(() => {
    window.dispatchEvent(new Event('bg:rebuild'))
  }, [active])

  return (
    <div className={styles.accessories}>
      <header className={styles.accessories__header}>
        <h1 className={styles.accessories__title} {...titleHalo}>{title}</h1>
      </header>

      {showFilters && series.length > 0 && (
        <div className={styles.accessories__filters}>
          <button
            type="button"
            className={`${styles.filter}${active === 'all' ? ` ${styles['filter--active']}` : ''}`}
            onClick={() => setActive('all')}
          >
            {allLabel}
          </button>
          {series
            .filter((s) => s.slug)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.filter}${active === s.slug ? ` ${styles['filter--active']}` : ''}`}
                onClick={() => setActive(s.slug as string)}
              >
                {s.name}
              </button>
            ))}
        </div>
      )}

      <ul className={styles.grid}>
        {filtered.map((b) => (
          <li key={b._id}>
            <AccessoryCard
              href={`/boards/${b.slug}`}
              name={b.name}
              imageUrl={b.imageUrl}
              categoryName={b.seriesName}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
