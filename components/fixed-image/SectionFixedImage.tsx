import type { CSSProperties } from 'react'
import type { Cta } from '@/sanity/lib/types'
import styles from './SectionFixedImage.module.css'

export type FixedImageItem = {
  _key?: string
  imageUrl?: string
  title?: string
  text?: string
  cta?: Cta
  /** 1–12 grid column where the text block starts. */
  startColumn?: number
  /** 0–100 — vertical position of the text block (0 = top, 50 = middle, 100 = bottom). */
  verticalPosition?: number
}

type Props = {
  items: FixedImageItem[]
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

export default function SectionFixedImage({ items }: Props) {
  if (!items?.length) return null

  return (
    <section className={styles.section}>
      {items.map((item, i) => {
        const col = clamp(Math.round(item.startColumn ?? 2), 1, 12)
        const vPos = clamp(item.verticalPosition ?? 70, 0, 100)

        return (
          <div
            key={item._key ?? i}
            className={styles.panel}
            style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
          >
            <div
              className={styles.content}
              style={{ '--start-col': col, '--v-pos': vPos } as CSSProperties}
            >
              {item.title && <h2 className={styles.title}>{item.title}</h2>}
              {item.text && <p className={styles.text}>{item.text}</p>}
              {item.cta?.href && (
                <a
                  href={item.cta.href}
                  className={`u-cta u-cta--white-outline ${styles.cta}`}
                  target={item.cta.openInNewTab ? '_blank' : undefined}
                  rel={item.cta.openInNewTab ? 'noopener noreferrer' : undefined}
                >
                  {item.cta.text ?? 'Discover'}
                </a>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
