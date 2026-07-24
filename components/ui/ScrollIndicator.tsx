'use client'

import { useTranslations } from 'next-intl'
import styles from './ScrollIndicator.module.css'

/**
 * "Scroll" cue at the bottom of a hero: a vertical label beside a line with a pulse
 * running down it, scrolling one viewport on click.
 *
 * Placement is the caller's — pass a class that positions it. Two heroes wanted the
 * same cue in different corners, which is the only thing that ever differed between
 * their two near-identical copies of this.
 */
export default function ScrollIndicator({ className }: { className?: string }) {
  const t = useTranslations('boards')

  const handleClick = () => {
    const start = window.scrollY
    const target = window.innerHeight
    const duration = 400
    const startTime = performance.now()
    const easeOutSine = (x: number) => Math.sin((x * Math.PI) / 2)
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      window.scrollTo(0, start + (target - start) * easeOutSine(progress))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // aria-label from the catalogue: both originals hard-coded "Scroll to next
  // section" in English on a trilingual site, and the visible word on its own is
  // too thin a label to lean on.
  return (
    <button
      className={[styles.root, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      type="button"
      aria-label={t('scroll_aria')}
    >
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.text}>{t('scroll')}</span>
    </button>
  )
}
