'use client'

import styles from './HeroBoard.module.css'

export default function ScrollIndicator() {
  const handleClick = () => {
    const start = window.scrollY
    const target = window.innerHeight
    const duration = 400
    const startTime = performance.now()
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      window.scrollTo(0, start + (target - start) * easeOutSine(progress))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  return (
    <button
      className={styles.heroBoard__scroll}
      onClick={handleClick}
      type="button"
      aria-label="Scroll to next section"
    >
      <span className={styles.heroBoard__scrollLine} aria-hidden="true" />
      <span className={styles.heroBoard__scrollText}>scroll</span>
    </button>
  )
}
