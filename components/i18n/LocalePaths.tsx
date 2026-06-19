'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Per-locale paths for the current page's translations, de-prefixed (no locale
 * segment) — e.g. `{ en: '/faq', es: '/preguntas-frecuentes' }`.
 *
 * Pages whose slug differs per locale (CMS pages, products) publish this via
 * `<LocalePathsSync>` so the header language switcher links to the *same* page
 * in the target language instead of falling back to the current pathname.
 *
 * Module store + useSyncExternalStore (same pattern as the cart) so the header
 * — which lives in the layout, above the page — can read data the page owns.
 */
export type LocalePaths = Record<string, string>

let current: LocalePaths | null = null
const listeners = new Set<() => void>()

export function setLocalePaths(next: LocalePaths | null) {
  current = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

const getSnapshot = () => current
const getServerSnapshot = () => null

/** Read the current page's per-locale paths (null until a page publishes them). */
export function useLocalePaths(): LocalePaths | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Rendered by a page to publish its per-locale paths; clears them on unmount. */
export function LocalePathsSync({ paths }: { paths: LocalePaths }) {
  useEffect(() => {
    setLocalePaths(paths)
    return () => setLocalePaths(null)
  }, [paths])
  return null
}
