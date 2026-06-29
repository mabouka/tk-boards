'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './SectionTextYoutube.module.css'

// Minimal typing for the bits of the IFrame API we use (avoids @types/youtube).
type YTPlayer = { destroy?: () => void }
declare global {
  interface Window {
    YT?: { Player: new (el: Element, opts: Record<string, unknown>) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'

// Load the IFrame API once, shared across all players. Resolves only when
// window.YT.Player actually exists (not merely window.YT).
let apiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const tag = document.createElement('script')
      tag.src = API_SRC
      document.head.appendChild(tag)
    }
  })
  return apiPromise
}

type Props = { id: string; title: string; poster: string }

/**
 * Custom poster + play button. No iframe at load — so GSAP/ScrollTrigger on the
 * same page never touches a cross-origin frame during init. On click, the IFrame
 * Player API creates the player inside a React-owned host div (the API replaces
 * an imperatively-created child, which React never owns), so destroy() on unmount
 * can't collide with React removing the node. `host` points at the nocookie
 * domain so the postMessage handshake (JS control) works.
 */
export default function YoutubePlayer({ id, title, poster }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (!activated || !hostRef.current) return
    let cancelled = false
    const host = hostRef.current
    // Move focus to the player region (the play button that had focus is gone).
    host.focus()
    // The API REPLACES this node with the iframe — React never owns it.
    const target = document.createElement('div')
    host.appendChild(target)

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(target, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
      })
    })

    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy?.()
      } catch {
        /* iframe already detached */
      }
      playerRef.current = null
    }
  }, [activated, id])

  return (
    <div className={styles.player}>
      {activated ? (
        <div ref={hostRef} className={styles.playerHost} tabIndex={-1} aria-label={title} />
      ) : (
        <button
          type="button"
          className={styles.facade}
          onClick={() => setActivated(true)}
          aria-label={`Play video: ${title}`}
          style={{ backgroundImage: `url(${poster})` }}
        >
          <span className={styles.play} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
