'use client'

import { useState } from 'react'
import AccessoryCard from './AccessoryCard'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './Accessories.module.css'

// Glow behind the page title.
const titleHalo = haloProps({ rgb: '225, 255, 255', opacity: 0.26, w: '67vw', h: '32vh', spread: '1%' })

type Category = { id: string; name: string | null; slug: string | null }
type Accessory = {
  _id: string
  title: string
  slug: string
  imageUrl: string | null
  categoryName: string | null
  categorySlug: string | null
}

type Props = {
  title: string
  allLabel: string
  showFilters?: boolean
  categories: Category[]
  accessories: Accessory[]
}

export default function AccessoriesClient({
  title,
  allLabel,
  showFilters = true,
  categories,
  accessories,
}: Props) {
  const [active, setActive] = useState<string>('all')
  const filtered =
    active === 'all' ? accessories : accessories.filter((a) => a.categorySlug === active)

  return (
    <div className={styles.accessories}>
      <header className={styles.accessories__header}>
        <h1 className={styles.accessories__title} {...titleHalo}>{title}</h1>
      </header>

      {showFilters && categories.length > 0 && (
        <div className={styles.accessories__filters}>
          <button
            type="button"
            className={`${styles.filter}${active === 'all' ? ` ${styles['filter--active']}` : ''}`}
            onClick={() => setActive('all')}
          >
            {allLabel}
          </button>
          {categories
            .filter((c) => c.slug)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.filter}${active === c.slug ? ` ${styles['filter--active']}` : ''}`}
                onClick={() => setActive(c.slug as string)}
              >
                {c.name}
              </button>
            ))}
        </div>
      )}

      <ul className={styles.grid}>
        {filtered.map((a) => (
          <li key={a._id}>
            <AccessoryCard
              href={`/accessories/${a.slug}`}
              name={a.title}
              imageUrl={a.imageUrl}
              categoryName={a.categoryName}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
