'use client'

import { Fragment, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import styles from './SectionBigScrollText.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Props = { text: string }

/**
 * Big Scroll Text — large uppercase intro text whose words brighten from grey
 * to white as the section scrolls through the viewport (GSAP ScrollTrigger,
 * scroll-linked). The lit (white) state lives in CSS, so with no-JS or
 * prefers-reduced-motion the text simply renders white — never stuck grey.
 */
export default function SectionBigScrollText({ text }: Props) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const words = gsap.utils.toArray<HTMLElement>(`.${styles.word}`, root)
      if (!words.length) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          words,
          { opacity: 0.18 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.5,
            scrollTrigger: {
              trigger: root,
              start: 'top 80%',
              end: 'bottom 60%',
              scrub: true,
            },
          }
        )
      })
    },
    { scope: rootRef, dependencies: [text] }
  )

  // Preserve the editor's line breaks; split each line into words for the reveal.
  const lines = text.split('\n')

  return (
    <section ref={rootRef} className={styles.section}>
      <p className={styles.inner}>
        {lines.map((line, li) => (
          <Fragment key={`${li}:${line}`}>
            {line.split(/\s+/).map((word, wi) =>
              word === '' ? null : (
                <span key={`${wi}:${word}`} className={styles.word}>
                  {word}{' '}
                </span>
              )
            )}
            {li < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    </section>
  )
}
