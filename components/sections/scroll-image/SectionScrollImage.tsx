'use client'

import { useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './SectionScrollImage.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Soft glow behind each image (read by the global BgHalos layer).
const imageHalo = haloProps({ rgb: '225, 255, 255', opacity: 0.21, w: '56vw', h: '55vh', spread: '1%' })

export type ScrollImageItem = {
  _key?: string
  imageUrl?: string
  alt?: string
  aspectRatio?: number
  /** 1–12 grid column where the image starts. */
  startColumn?: number
  /** Image width in grid columns (1–12). */
  widthColumns?: number
  /** Vertical offset in vh (creates the stagger). */
  offsetY?: number
  /** Parallax speed (-1 to 1); 0 = static. */
  speed?: number
}

type Props = { items: ScrollImageItem[] }

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

/**
 * Scroll Image — staggered, overlapping images placed on the 12-column grid,
 * each drifting vertically at its own speed as the section scrolls (parallax).
 * The whole figure is translated (not the inner image) so no gaps appear.
 * Desktop only: on mobile the images stack full-width with no parallax. The
 * parallax is applied in JS, so no-JS / reduced-motion just shows them static.
 */
export default function SectionScrollImage({ items }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Rebuild the parallax when any per-item config changes — not just the count,
  // so editing a speed/column/offset (same length) re-runs GSAP.
  const signature = items
    .map((i) => `${i.imageUrl}|${i.speed}|${i.startColumn}|${i.widthColumns}|${i.offsetY}`)
    .join(';')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const figures = gsap.utils.toArray<HTMLElement>(`.${styles.figure}`, root)
      if (!figures.length) return

      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const cleanups: Array<() => void> = []
        // GSAP/ScrollTrigger can throw a cross-origin SecurityError when the page
        // runs inside a cross-origin iframe (e.g. a preview sandbox). Skip the
        // parallax rather than crash the page — top-level users animate normally.
        try {
          figures.forEach((fig) => {
            const speed = parseFloat(fig.dataset.speed || '0')
            if (!speed) return
            // Drift the figure from +range (entering) to -range (leaving).
            const range = speed * 300
            gsap.fromTo(
              fig,
              { y: range },
              {
                y: -range,
                ease: 'none',
                scrollTrigger: {
                  trigger: root,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              }
            )
          })
          // Images set the section height *after* setup → recompute trigger
          // positions once each has loaded (otherwise start/end are stale).
          // Track the listeners so they're removed if this context reverts
          // before the image loads (a late load() would refresh dead triggers).
          const onLoad = () => ScrollTrigger.refresh()
          root.querySelectorAll('img').forEach((im) => {
            if (!im.complete) {
              im.addEventListener('load', onLoad, { once: true })
              cleanups.push(() => im.removeEventListener('load', onLoad))
            }
          })
          ScrollTrigger.refresh()
        } catch (e) {
          console.warn('[ScrollImage] parallax skipped:', e)
        }
        return () => cleanups.forEach((fn) => fn())
      })
    },
    { scope: rootRef, dependencies: [signature] }
  )

  if (!items?.length) return null

  return (
    <div ref={rootRef} className={styles.section}>
      {items.map((it, i) => {
        if (!it.imageUrl) return null
        const start = clamp(Math.round(it.startColumn ?? 1), 1, 12)
        const span = clamp(Math.round(it.widthColumns ?? 6), 1, 12 - start + 1)
        const ar = it.aspectRatio && it.aspectRatio > 0 ? it.aspectRatio : 1
        const w = 1400
        // Desktop renders the image at span/12 of the viewport — tell the
        // browser so it doesn't fetch a ~60vw source for a narrow image.
        const sizes = `(max-width: 767px) 100vw, ${Math.round((span / 12) * 100)}vw`
        return (
          <figure
            key={it._key ?? i}
            className={styles.figure}
            data-speed={it.speed ?? 0}
            {...imageHalo}
            style={
              {
                '--start': start,
                '--span': span,
                '--offset': it.offsetY ?? 0,
                zIndex: i + 1,
              } as CSSProperties
            }
          >
            <Image
              src={it.imageUrl}
              alt={it.alt ?? ''}
              width={w}
              height={Math.round(w / ar)}
              className={styles.img}
              sizes={sizes}
            />
          </figure>
        )
      })}
    </div>
  )
}
