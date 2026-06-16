'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Halos, { type Halo } from '@/components/halo/Halos'
import styles from './SectionOutline.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export type OutlineMilestone = {
  year: string
  name: string
  tag: string
  /** SVG path drawn inside a shared `0 0 100 300` viewBox. */
  svgPath: string
}

type Props = {
  eyebrow?: string
  title: string
  intro: string
  milestones: OutlineMilestone[]
  /** Final board photo revealed at the end (mockup now, Sanity later). */
  finalImageUrl?: string
  finalLabel?: { title: string; subtitle: string }
}

const VIEWBOX = '0 0 100 300'
const GHOST = 0.13 // faint trace of the previous outline
const DIM = 0.5 // inactive timeline row

// Background halos for the section — tweak colours/positions here. They render in
// the global base layer (see Halos.tsx). y offsets place them at different scroll
// depths down the section. Brand blue-white, matching the site's other halos.
const HALOS: Halo[] = [
  { rgb: '225, 255, 255', opacity: 0.25, w: '80vw', h: '70vh', spread: '0%', anchor: 'top-left', y: '0vh' },
  { rgb: '225, 255, 255', opacity: 0.25, w: '80vw', h: '70vh', spread: '0%', anchor: 'top-right', y: '100vh' },
  { rgb: '225, 255, 255', opacity: 0.25, w: '80vW', h: '70vh', spread: '0%', anchor: 'top-left', y: '250vh' },
  { rgb: '225, 255, 255', opacity: 0.25, w: '80vW', h: '70vh', spread: '0%', anchor: 'top-right', y: '390vh' },

]

/**
 * Outline — the board's shape evolution. The section is sticky for its scroll
 * length; a scrubbed GSAP timeline fades+scales each era's outline SVG in (the
 * previous one drops to a faint ghost) while the matching timeline row lights up,
 * then reveals the final board photo. Desktop only; mobile / reduced-motion show
 * a static fallback (final photo + timeline). Dark section.
 */
export default function SectionOutline({
  eyebrow = 'Outline',
  title,
  intro,
  milestones,
  finalImageUrl,
  finalLabel,
}: Props) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || milestones.length === 0) return

      ScrollTrigger.config({ ignoreMobileResize: true })

      // Pins above shift our halo markers' document positions; re-bake the global
      // halos whenever ScrollTrigger recomputes layout.
      const rebuildHalos = () => window.dispatchEvent(new Event('bg:rebuild'))
      ScrollTrigger.addEventListener('refresh', rebuildHalos)

      const mm = gsap.matchMedia()
      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const outlines = gsap.utils.toArray<HTMLElement>(`.${styles.outline}`, root)
        const rows = gsap.utils.toArray<HTMLElement>(`.${styles.row}`, root)
        const dots = rows.map((r) => r.querySelector(`.${styles.dot}`))
        const names = rows.map((r) => r.querySelector(`.${styles.name}`))
        const photo = root.querySelector(`.${styles.finalPhoto}`)
        const label = root.querySelector(`.${styles.finalLabel}`)

        gsap.set(outlines, { scale: 5, opacity: 0, transformOrigin: '50% 50%' })
        gsap.set(rows, { opacity: DIM })
        gsap.set(dots, { backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(255,255,255,0.25)' })
        gsap.set(names, { color: 'rgba(255,255,255,0.4)' })
        if (photo) gsap.set(photo, { opacity: 0 })
        if (label) gsap.set(label, { opacity: 0 })

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
        })

        const activate = (i: number, pos: string) => {
          tl.to(rows[i], { opacity: 1, duration: 0.1 }, pos)
          tl.to(dots[i], { backgroundColor: '#fff', borderColor: '#fff', duration: 0.1 }, '<')
          tl.to(names[i], { color: '#fff', duration: 0.1 }, '<')
        }
        const deactivate = (i: number, pos: string) => {
          tl.to(rows[i], { opacity: DIM, duration: 0.1 }, pos)
          tl.to(dots[i], { backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(255,255,255,0.25)', duration: 0.1 }, '<')
          tl.to(names[i], { color: 'rgba(255,255,255,0.4)', duration: 0.1 }, '<')
        }

        activate(0, '>')
        tl.to(outlines[0], { opacity: 1, scale: 1, duration: 0.3, ease: 'expo.out' }, '<')
        tl.to({}, { duration: 0.06 })

        for (let i = 1; i < outlines.length; i++) {
          deactivate(i - 1, '>')
          activate(i, '<')
          tl.to(outlines[i - 1], { opacity: GHOST, duration: 0.12 }, '<')
          tl.to(outlines[i], { opacity: 1, scale: 1, duration: 0.3, ease: 'expo.out' }, '<')
          tl.to({}, { duration: i === outlines.length - 1 ? 0.2 : 0.06 })
        }

        if (photo) {
          tl.to(photo, { opacity: 1, duration: 0.25 })
          tl.to(outlines, { opacity: 0, duration: 0.22 }, '<0.04')
          if (label) tl.to(label, { opacity: 1, duration: 0.2 }, '<0.1')
        }
      })

      // Content above (lazy images, other pinned sections) can shift our
      // start/end after init — recompute once the page is fully loaded.
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
      }

      return () => ScrollTrigger.removeEventListener('refresh', rebuildHalos)
    },
    { scope: rootRef, dependencies: [milestones.length] }
  )

  return (
    <section
      ref={rootRef}
      className={styles.section}
      style={{ '--ol-steps': milestones.length } as React.CSSProperties}
    >
      <Halos halos={HALOS} />
      <div className={styles.sticky}>
        {/* Visual — stacked outlines + the final photo */}
        <div className={styles.visual}>
          {milestones.map((m, i) => (
            <div key={i} className={styles.board}>
              <div className={styles.outline}>
                <svg viewBox={VIEWBOX} aria-label={`${m.year} — ${m.name}`}>
                  <path d={m.svgPath} />
                </svg>
              </div>
            </div>
          ))}
          {finalImageUrl && (
            <div className={styles.finalPhoto}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={finalImageUrl} alt={finalLabel?.title ?? ''} />
            </div>
          )}
          {finalLabel && (
            <div className={styles.finalLabel}>
              <strong>{finalLabel.title}</strong>
              <span>{finalLabel.subtitle}</span>
            </div>
          )}
        </div>

        {/* Content — eyebrow, title, intro, timeline */}
        <div className={styles.content}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.intro}>{intro}</p>
          <ul className={styles.timeline}>
            {milestones.map((m, i) => (
              <li key={i} className={styles.row}>
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.year}>{m.year}</span>
                <span className={styles.name}>{m.name}</span>
                <span className={styles.tag}>{m.tag}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
