'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './SectionFullMedia.module.css'

type Props = {
  src: string
  poster?: string
  controls?: boolean
}

/**
 * Native <video> for a direct MP4 (host on R2 — free egress, no player JS, and
 * the browser streams it progressively via HTTP range requests).
 *
 * Lazy: nothing of the video is fetched until it nears the viewport — the poster
 * shows meanwhile. Client component to drive the IntersectionObserver and
 * guarantee muted autoplay.
 */
export default function FullMediaVideo({ src, poster, controls }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoad(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!load || !el) return
    el.load()
    if (!controls) {
      el.muted = true
      el.play?.().catch(() => {})
    }
  }, [load, controls])

  return (
    <video
      ref={ref}
      className={styles.fullMedia__media}
      poster={poster}
      preload="none"
      playsInline
      {...(controls ? { controls: true } : { loop: true, muted: true })}
    >
      {load && <source src={src} type="video/mp4" />}
    </video>
  )
}
