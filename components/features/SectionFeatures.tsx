'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import FullMediaVideo from '@/components/full-media/FullMediaVideo'
import styles from './SectionFeatures.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export type FeatureItem = {
  title: string
  text: string
  /** Image OR video. If `videoUrl` is set it wins; otherwise `imageUrl` is used. */
  imageUrl?: string
  videoUrl?: string
  videoPoster?: string
  cta?: { text?: string; href?: string; openInNewTab?: boolean }
}

type Props = {
  items: FeatureItem[]
  theme?: 'light' | 'dark'
}

/**
 * Features — board features (image or video + title + text, optional CTA).
 * On desktop the section pins and the track scrolls horizontally as you scroll
 * the page (GSAP ScrollTrigger). On mobile the pin is disabled and items stack
 * vertically (scroll-hijacking is janky on touch). Light or dark. One item min.
 */
export default function SectionFeatures({ items, theme = 'light' }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      if (!root || !track || items.length <= 1) return

      // Don't refresh on the mobile URL-bar show/hide (avoids jank/recalcs).
      ScrollTrigger.config({ ignoreMobileResize: true })

      const mm = gsap.matchMedia()
      // Pin + horizontal scrub: desktop only, and only if the user is OK with
      // motion. The pinned-canvas state (100vh + clipped) is applied HERE in JS,
      // not in CSS — so if GSAP never runs (reduced-motion, no-JS, load failure)
      // the CSS fallback (native horizontal scroll) stays and items are never cut.
      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        root.style.height = '100vh'
        root.style.overflow = 'hidden'

        const distance = () => Math.max(0, track.scrollWidth - root.offsetWidth)
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })

        return () => {
          root.style.height = ''
          root.style.overflow = ''
        }
      })
    },
    { scope: rootRef, dependencies: [items.length] }
  )

  const ctaClass = theme === 'dark' ? 'u-cta u-cta--white-outline' : 'u-cta u-cta--black-outline'

  return (
    <section ref={rootRef} className={`${styles.features} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <ul ref={trackRef} className={styles.track}>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            <div className={styles.media} >
              {item.videoUrl ? (
                <FullMediaVideo src={item.videoUrl} poster={item.videoPoster} />
              ) : item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  quality={85}
                  sizes="(max-width: 768px) 90vw, 46vw"
                  className={styles.mediaImg}
                />
              ) : null}
            </div>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.text}>{item.text}</p>
            {item.cta?.href && item.cta.text && (
              <a
                className={`${ctaClass} ${styles.cta}`}
                href={item.cta.href}
                {...(item.cta.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.cta.text}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
