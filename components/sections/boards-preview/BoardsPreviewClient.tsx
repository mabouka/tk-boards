'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './BoardsPreview.module.css'

type Board = {
  _id: string
  name: string
  slug: { current: string }
  style?: string
  imageUrl?: string
}

type Series = {
  _id: string
  name: string
  slug: { current: string }
  tagVariant?: 'dark' | 'amber' | 'cream' | 'red' | 'outline-light' | 'outline-muted'
  boards: Board[]
}

type Props = {
  series: Series[]
  title: string
  discoverCta: string
  viewBoardLabel: string
  showFilters?: boolean
  filterBySeries?: boolean
}

type BoardWithSeries = Board & {
  seriesName: string
  seriesTagVariant: Series['tagVariant']
}

export default function BoardsPreviewClient({ series, title, discoverCta, viewBoardLabel, showFilters = true, filterBySeries = true }: Props) {
  const [activeId, setActiveId] = useState(series[0]?._id ?? '')
  const activeSeries = series.find(s => s._id === activeId)

  const boards: BoardWithSeries[] = filterBySeries
    ? (activeSeries?.boards ?? []).map(board => ({
        ...board,
        seriesName: activeSeries?.name ?? '',
        seriesTagVariant: activeSeries?.tagVariant,
      }))
    : series.flatMap(s =>
        s.boards.map(board => ({
          ...board,
          seriesName: s.name,
          seriesTagVariant: s.tagVariant,
        })),
      )

  return (
    <section className={styles.boards}>
      <h2 className={styles.boards__title}>{title}</h2>

      {filterBySeries && showFilters && series.length > 1 && (
        <div className={styles.boards__filters}>
          {series.map(s => (
            <button
              key={s._id}
              type="button"
              className={`${styles.boards__filter}${s._id === activeId ? ` ${styles['boards__filter--active']}` : ''}`}
              onClick={() => setActiveId(s._id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.boards__scroll}>
        <div
          className={styles.boards__track}
          {...haloProps({ rgb: '215, 215, 255', opacity: 0.39, w: '74vw', h: '71vh', spread: '13%' })}
        >
          {boards.map(board => (
            <Link
              key={board._id}
              href={`/boards/${board.slug.current}`}
              className={styles.boards__card}
              aria-label={`${board.name}${board.style ? ` — ${board.style}` : ''}`}
            >
              {board.imageUrl && (
                <Image
                  src={board.imageUrl}
                  alt={board.name}
                  fill
                  quality={85}
                  className={styles.boards__card_img}
                  sizes="390px"
                />
              )}
              <div className={styles.boards__card_overlay} aria-hidden="true" />
              <span className={styles.boards__card_name}>{board.name}</span>
              <div className={styles.boards__card_meta}>
                <span className={`${styles.boards__card_tag} u-tag--${board.seriesTagVariant ?? 'dark'}`}>{board.seriesName}</span>
                {board.style && (
                  <span className={`${styles.boards__card_tag} u-tag--cream`}>{board.style}</span>
                )}
              </div>
              <span className={styles.boards__card_cta}>{viewBoardLabel}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/boards" className={styles.boards__discover}>
        {discoverCta}
      </Link>
    </section>
  )
}
