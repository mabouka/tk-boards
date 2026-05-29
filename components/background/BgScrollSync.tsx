'use client'

import { useEffect } from 'react'

/**
 * Watches sections with data-bg-* attributes and applies their
 * halo values to :root CSS variables when they enter the viewport.
 *
 * Each section opts-in by setting any of:
 *   data-bg-h1-rgb        "255, 221, 173"
 *   data-bg-h1-opacity    "0.30"           (0–1)
 *   data-bg-h1-x          "-30vw"
 *   data-bg-h1-y          "75vh"
 *   data-bg-h1-w          "90vw"
 *   data-bg-h1-h          "60vh"
 *   data-bg-h1-spread     "1%"
 *   data-bg-h2-*          (same, for halo 2)
 *   data-bg-base          "#0a0a0a"         (background color)
 *
 * Sections without any data-bg-* attributes are invisible to the observer.
 */

const BG_ATTRS = [
  ['--h1-rgb',    'data-bg-h1-rgb'],
  ['--h1-opacity','data-bg-h1-opacity'],
  ['--h1-x',      'data-bg-h1-x'],
  ['--h1-y',      'data-bg-h1-y'],
  ['--h1-w',      'data-bg-h1-w'],
  ['--h1-h',      'data-bg-h1-h'],
  ['--h1-spread', 'data-bg-h1-spread'],
  ['--h2-rgb',    'data-bg-h2-rgb'],
  ['--h2-opacity','data-bg-h2-opacity'],
  ['--h2-x',      'data-bg-h2-x'],
  ['--h2-y',      'data-bg-h2-y'],
  ['--h2-w',      'data-bg-h2-w'],
  ['--h2-h',      'data-bg-h2-h'],
  ['--h2-spread', 'data-bg-h2-spread'],
  ['--bg-base',   'data-bg-base'],
] as const

export default function BgScrollSync() {
  useEffect(() => {
    const root = document.documentElement
    const sections = document.querySelectorAll<HTMLElement>('[data-bg-section]')
    if (!sections.length) return

    function applySection(el: HTMLElement) {
      BG_ATTRS.forEach(([cssVar, attr]) => {
        const val = el.getAttribute(attr)
        if (val !== null) root.style.setProperty(cssVar, val)
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio
        const best = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (best) applySection(best.target as HTMLElement)
      },
      {
        threshold: [0.1, 0.3, 0.5, 0.7],
        rootMargin: '-10% 0px -10% 0px',
      }
    )

    sections.forEach(s => observer.observe(s))
    // Apply the first section immediately
    applySection(sections[0])

    return () => observer.disconnect()
  }, [])

  return null
}
