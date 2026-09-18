'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

export type SortDir = 'asc' | 'desc'
export type SortState = { key: string; dir: SortDir }

/**
 * Client-side, multi-column sort for the admin tables. Pass comparators keyed by
 * column id; `toggle(key)` switches to that column (desc first, then asc/desc).
 * Rows without a comparator for the active key are returned unsorted.
 */
export function useSort<T>(
  rows: T[],
  comparators: Record<string, (a: T, b: T) => number>,
  initial: SortState
) {
  const [sort, setSort] = useState<SortState>(initial)
  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  const cmp = comparators[sort.key]
  const sorted = cmp ? [...rows].sort((a, b) => (sort.dir === 'asc' ? cmp(a, b) : -cmp(a, b))) : rows
  return { sorted, sort, toggle }
}

/** Clickable column header that reflects and drives a {@link useSort} state. */
export function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
  align = 'left',
}: {
  label: string
  sortKey: string
  sort: SortState
  onToggle: (key: string) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === sortKey
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={`hover:text-foreground inline-flex items-center gap-1 ${align === 'right' ? 'ml-auto' : ''}`}
    >
      {label}
      {!active ? (
        <ChevronsUpDown className="text-muted-foreground size-3.5" />
      ) : sort.dir === 'asc' ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ArrowDown className="size-3.5" />
      )}
    </button>
  )
}
