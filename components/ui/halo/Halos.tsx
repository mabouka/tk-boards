'use client'

import { useEffect } from 'react'
import { haloProps } from './haloProps'
import styles from './Halos.module.css'

export type HaloAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type Halo = {
  /** "r, g, b" */
  rgb?: string
  opacity?: number
  /** gradient size, e.g. "65vw" */
  w?: string
  /** gradient size, e.g. "65vh" */
  h?: string
  /** inner colour stop (where the fade starts), e.g. "1%" */
  spread?: string
  /** where on the parent the halo is anchored before the x/y offset */
  anchor?: HaloAnchor
  /** offset from the anchor, any CSS length — e.g. "10vw", "-5vw" */
  x?: string
  /** offset from the anchor, any CSS length — e.g. "100vh", "200vh" */
  y?: string
}

const ANCHORS: Record<HaloAnchor, { left: string; top: string }> = {
  center: { left: '50%', top: '50%' },
  top: { left: '50%', top: '0%' },
  bottom: { left: '50%', top: '100%' },
  left: { left: '0%', top: '50%' },
  right: { left: '100%', top: '50%' },
  'top-left': { left: '0%', top: '0%' },
  'top-right': { left: '100%', top: '0%' },
  'bottom-left': { left: '0%', top: '100%' },
  'bottom-right': { left: '100%', top: '100%' },
}

/**
 * Multiple halos for a section, rendered by the GLOBAL background layer (BgHalos)
 * — same as every other `data-halo` halo, so they sit in the base layer behind
 * all content, not painted inside the section.
 *
 * Each entry becomes an invisible `data-halo` marker positioned (anchor + x/y
 * offset, e.g. y:"100vh"/"200vh") inside the parent; BgHalos reads the marker's
 * document position and draws the glow at the base. The parent must be
 * `position: relative`. Dispatches `bg:rebuild` so BgHalos picks the markers up
 * (and re-bakes after the layout settles).
 */
export default function Halos({ halos }: { halos: Halo[] }) {
  useEffect(() => {
    const rebuild = () => window.dispatchEvent(new Event('bg:rebuild'))
    rebuild()
    window.addEventListener('load', rebuild)
    window.addEventListener('resize', rebuild)
    return () => {
      window.removeEventListener('load', rebuild)
      window.removeEventListener('resize', rebuild)
    }
  }, [])

  if (!halos?.length) return null

  return (
    <div className={styles.halos} aria-hidden="true">
      {halos.map((h, i) => {
        const a = ANCHORS[h.anchor ?? 'center']
        return (
          <span
            key={i}
            className={styles.marker}
            style={{
              left: h.x ? `calc(${a.left} + ${h.x})` : a.left,
              top: h.y ? `calc(${a.top} + ${h.y})` : a.top,
            }}
            {...haloProps({
              anchor: 'center',
              rgb: h.rgb ?? '212, 172, 251',
              opacity: h.opacity ?? 0.36,
              w: h.w ?? '67vw',
              h: h.h ?? '64vh',
              spread: h.spread ?? '1%',
            })}
          />
        )
      })}
    </div>
  )
}
