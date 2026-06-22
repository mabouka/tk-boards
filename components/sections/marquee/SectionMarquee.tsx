'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import styles from './SectionMarquee.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type MarqueeItem = {
  _key: string
  text?: string
  accent?: boolean
}

type Props = {
  items: MarqueeItem[]
}

function Track({ items }: { items: MarqueeItem[] }) {
  return (
    <>
      {items.map((item) => (
        <span key={item._key} className={styles.marquee__group}>
          <span className={item.accent ? styles['marquee__item--accent'] : styles.marquee__item}>
            {item.text}
          </span>
          <span className={styles.marquee__sep} aria-hidden="true">·</span>
        </span>
      ))}
    </>
  )
}

export default function SectionMarquee({ items }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const track = trackRef.current
      const root = rootRef.current
      if (!track || !root) return

      // Respect reduced-motion: leave it static.
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Base loop: the track is duplicated, so -50% = one set → seamless.
        const loop = gsap.to(track, { xPercent: -50, repeat: -1, ease: 'none', duration: 30 })
        // Keep it looping when played BACKWARD (negative timeScale) instead of
        // stopping at the start — jump the time forward on reverse-complete.
        loop.eventCallback('onReverseComplete', () =>
          loop.totalTime(loop.totalTime() + loop.duration() * 100)
        )

        // Scroll velocity drives speed + direction (down = faster, up = reverse),
        // only while the marquee is in view. `dir` is shared so the drift after
        // scroll-end keeps the last scrolled direction.
        let dir = 1
        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const v = self.getVelocity()
            if (v === 0) return
            dir = v < 0 ? -1 : 1
            const boost = gsap.utils.clamp(1, 6, Math.abs(v) / 300)
            gsap.to(loop, { timeScale: boost * dir, duration: 0.2, overwrite: true })
          },
        })

        // Ease back to base drift once scrolling stops — keeping the LAST scroll
        // direction (scroll down → forward, scroll up → reversed, and it stays).
        const onScrollEnd = () => gsap.to(loop, { timeScale: dir, duration: 0.6, overwrite: true })
        ScrollTrigger.addEventListener('scrollEnd', onScrollEnd)

        return () => {
          ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd)
          st.kill()
          loop.kill()
        }
      })
    },
    { scope: rootRef, dependencies: [items.length] }
  )

  if (!items?.length) return null

  return (
    <div ref={rootRef} className={styles.marquee} aria-label="marquee">
      <div ref={trackRef} className={styles.marquee__track}>
        <Track items={items} />
        {/* Duplicated for a seamless loop */}
        <Track items={items} />
      </div>
    </div>
  )
}
