'use client'

import styles from './Hero.module.css'

export default function ScrollButton() {
  const handleClick = () => {
    const start     = window.scrollY
    const target    = window.innerHeight
    const duration  = 400 // ms
    const startTime = performance.now()

    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)

    const step = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      window.scrollTo(0, start + (target - start) * easeOutSine(progress))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  return (
    <button
      className={styles.hero__scroll}
      onClick={handleClick}
      aria-label="Scroll to next section"
      type="button"
    >
      <span className={styles.hero__scroll_text}>scroll</span>
      <span className={styles.hero__scroll_line} />
    </button>
  )
}
