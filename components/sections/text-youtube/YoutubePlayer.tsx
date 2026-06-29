'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './SectionTextYoutube.module.css'

// Minimal typing for the bits of the IFrame API we use (avoids @types/youtube).
type YTPlayer = { destroy?: () => void }
declare global {
  interface Window {
    YT?: { Player: new (el: Element, opts: Record<string, unknown>) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

// Load https://www.youtube.com/iframe_api once, shared across all players.
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
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

type Props = { id: string; title: string; poster: string }

/**
 * Custom poster + play button. No iframe at load — so GSAP/ScrollTrigger on the
 * same page never touches a cross-origin frame during init. On click, React
 * renders the (nocookie) iframe with `enablejsapi=1` and we bind a YT.Player to
 * the *existing* iframe (it isn't replaced, so React keeps owning the node),
 * giving a JS handle (`playerRef`) for programmatic control.
 */
export default function YoutubePlayer({ id, title, poster }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (!activated) return
    let cancelled = false
    loadYouTubeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.YT) return
      playerRef.current = new window.YT.Player(iframeRef.current, {})
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [activated])

  const activate = useCallback(() => setActivated(true), [])

  return (
    <div className={styles.player}>
      {activated ? (
        <iframe
          ref={iframeRef}
          className={styles.playerIframe}
          src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className={styles.facade}
          onClick={activate}
          aria-label={`Play video: ${title}`}
          style={{ backgroundImage: `url(${poster})` }}
        >
          <span className={styles.play} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
