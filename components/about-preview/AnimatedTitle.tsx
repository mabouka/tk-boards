'use client'

import { useEffect, useRef } from 'react'
import styles from './SectionAboutPreview.module.css'

export default function AnimatedTitle({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = 'true'
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Sépare les mots en conservant les sauts de ligne
  const parts = title.split(/(\n)/)
  let wordIndex = 0

  return (
    <h2 ref={ref} className={styles.aboutPreview__title}>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />
        return part.split(' ').map((word, j) => {
          if (!word) return j < part.split(' ').length - 1
            ? <span key={`${i}-${j}`}> </span>
            : null
          const idx = wordIndex++
          return (
            <span
              key={`${i}-${j}`}
              className={styles.aboutPreview__word}
              style={{ '--wi': idx } as React.CSSProperties}
            >
              {word}{j < part.split(' ').length - 1 ? ' ' : ''}
            </span>
          )
        })
      })}
    </h2>
  )
}
