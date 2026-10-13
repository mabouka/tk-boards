'use client'

import { useEffect, useState } from 'react'
import type { HTMLAttributes } from 'react'
import AccessoryCard from '../accessories/AccessoryCard'
import styles from '../accessories/Accessories.module.css'

export type GridFilter = { id: string; name: string | null; slug: string | null }
export type GridItem = {
  _id: string
  name: string
  href: string
  imageUrl: string | null
  /** Tag shown top-left on the card (category / series name). */
  tagLabel: string | null
  /** Slug matched against the active filter; null = only shown under "all". */
  filterKey: string | null
}

type Props = {
  title: string
  titleHalo?: HTMLAttributes<HTMLElement>
  allLabel: string
  showFilters?: boolean
  filters: GridFilter[]
  items: GridItem[]
}

/**
 * Listing layout shared by /accessories and /boards: centered title, a row of tab
 * filters ("All" + one per filter) and a grid of square cards. Pages map their own
 * data (categories/series → filters, accessories/boards → items) and pass it in.
 */
export default function FilterableCardGrid({
  title,
  titleHalo,
  allLabel,
  showFilters = true,
  filters,
  items,
}: Props) {
  const [active, setActive] = useState<string>('all')
  const filtered = active === 'all' ? items : items.filter((i) => i.filterKey === active)

  // Filtering adds/removes [data-halo] cards → tell the global BgHalos layer to
  // recompute (matches the Halos.tsx / SectionOutline.tsx pattern).
  useEffect(() => {
    window.dispatchEvent(new Event('bg:rebuild'))
  }, [active])

  return (
    <div className={styles.accessories}>
      <header className={styles.accessories__header}>
        <h1 className={styles.accessories__title} {...titleHalo}>{title}</h1>
      </header>

      {showFilters && filters.length > 0 && (
        <div className={styles.accessories__filters}>
          <button
            type="button"
            className={`${styles.filter}${active === 'all' ? ` ${styles['filter--active']}` : ''}`}
            onClick={() => setActive('all')}
          >
            {allLabel}
          </button>
          {filters
            .filter((f) => f.slug)
            .map((f) => {
              // On phones the trailing "Series" is dropped so pills fit one line
              // (Carbon Series → Carbon); desktop keeps the full name.
              const short = f.name?.replace(/\s+s[ée]ries?$/i, '') ?? ''
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.filter}${active === f.slug ? ` ${styles['filter--active']}` : ''}`}
                  onClick={() => setActive(f.slug as string)}
                >
                  <span className={styles.filterFull}>{f.name}</span>
                  <span className={styles.filterShort}>{short}</span>
                </button>
              )
            })}
        </div>
      )}

      <ul className={styles.grid}>
        {filtered.map((i) => (
          <li key={i._id}>
            <AccessoryCard href={i.href} name={i.name} imageUrl={i.imageUrl} categoryName={i.tagLabel} />
          </li>
        ))}
      </ul>
    </div>
  )
}
