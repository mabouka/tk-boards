'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const FADE_MS = 250

function buildGradients(layer: HTMLElement) {
  const halos = document.querySelectorAll<HTMLElement>('[data-halo]')
  const gradients: string[] = []

  halos.forEach(el => {
    const rect    = el.getBoundingClientRect()
    const anchor  = el.dataset.haloAnchor ?? 'center'
    const docLeft = rect.left + window.scrollX
    const docTop  = rect.top  + window.scrollY

    let cx: number, cy: number
    switch (anchor) {
      case 'top-left':     cx = docLeft;               cy = docTop;               break
      case 'top-right':    cx = docLeft + rect.width;  cy = docTop;               break
      case 'bottom-left':  cx = docLeft;               cy = docTop + rect.height; break
      case 'bottom-right': cx = docLeft + rect.width;  cy = docTop + rect.height; break
      default:             cx = docLeft + rect.width / 2; cy = docTop + rect.height / 2
    }
    cx = Math.round(cx)
    cy = Math.round(cy)

    const rgb      = el.dataset.haloRgb     ?? '212, 172, 251'
    const rawOp    = parseFloat(el.dataset.haloOpacity ?? '0.36')
    const w        = el.dataset.haloW       ?? '67vw'
    const h        = el.dataset.haloH       ?? '64vh'
    const spread   = el.dataset.haloSpread  ?? '1%'

    const master   = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--halos-master-opacity').trim() || '1'
    )
    const opacity  = (rawOp * master).toFixed(3)

    gradients.push(
      `radial-gradient(${w} ${h} at ${cx}px ${cy}px, rgba(${rgb}, ${opacity}) ${spread}, transparent)`
    )
  })

  layer.style.backgroundImage = gradients.join(', ')
}

export default function BgHalos() {
  const pathname = usePathname()
  const layerRef = useRef<HTMLElement | null>(null)
  const isFirst  = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Mount : initial build + ResizeObserver + custom event ── */
  useEffect(() => {
    const layer = document.querySelector<HTMLElement>('[data-bg-halos-layer]')
    if (!layer) return
    layerRef.current = layer

    buildGradients(layer)

    const ro = new ResizeObserver(() => {
      if (layerRef.current) buildGradients(layerRef.current)
    })
    ro.observe(document.documentElement)

    function onRebuild() {
      if (layerRef.current) buildGradients(layerRef.current)
    }
    window.addEventListener('bg:rebuild', onRebuild)

    return () => {
      ro.disconnect()
      window.removeEventListener('bg:rebuild', onRebuild)
    }
  }, [])

  /* ── Route change : fade out → rebuild → fade in ── */
  useEffect(() => {
    // Skip first run (handled by mount effect above)
    if (isFirst.current) { isFirst.current = false; return }

    const layer = layerRef.current
    if (!layer) return

    // Clear any pending timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Fade out
    layer.style.opacity = '0'

    // After fade: rebuild with new page's halos, then fade in
    timerRef.current = setTimeout(() => {
      if (layerRef.current) {
        buildGradients(layerRef.current)
        layerRef.current.style.opacity = '1'
      }
    }, FADE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pathname])

  return null
}
