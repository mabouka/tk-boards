'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import styles from './BgConfigurator.module.css'

/* ── Types ───────────────────────────────────────────────────────────────── */

type Grain = {
  opacity: number // 0–100
  freq: number    // stored ×100 (110 = 1.10)
  oct: number
  blend: string
}

type Anchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type VirtualHalo = {
  id: number
  hex: string
  opacity: number  // 0–100
  x: number        // vw
  y: number        // vh (document)
  w: number        // vw
  h: number        // vh
  spread: number   // %
  anchor: Anchor
}

type RealHalo = {
  uid: string       // stable key: "real-<index at scan time>"
  el: HTMLElement   // live DOM reference (filter out sentinels)
  label: string
  hex: string
  opacity: number   // 0–100
  w: number         // vw (numeric)
  h: number         // vh (numeric)
  spread: number    // % (numeric)
  anchor: Anchor
}

type RealHaloEditKey = keyof Omit<RealHalo, 'uid' | 'el' | 'label'>

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function rgbToHex(rgb: string): string {
  const parts = rgb.split(',').map(s => parseInt(s.trim(), 10))
  if (parts.length !== 3 || parts.some(isNaN)) return '#d4acfb'
  return '#' + parts.map(n => n.toString(16).padStart(2, '0')).join('')
}

function parseUnit(s: string): number {
  return parseFloat(s) || 0
}

/** Derive a readable label from a live DOM element's CSS Modules class names. */
function getLabel(el: HTMLElement): string {
  const classes = Array.from(el.classList)
  // CSS Modules: ComponentName_localName__hash  (component starts with uppercase)
  const mod = classes.find(c => /^[A-Z][A-Za-z]+_/.test(c))
  if (mod) {
    // Strip trailing hash segment (4+ lowercase hex chars after final __)
    const clean = mod.replace(/__[a-z0-9]{4,}$/, '')
    const idx   = clean.indexOf('_')
    if (idx !== -1) {
      const component = clean.slice(0, idx)
      const local     = clean.slice(idx + 1).replace(/__/g, ' › ')
      return `${component} › ${local}`
    }
    return clean
  }
  const tag = el.tagName.toLowerCase()
  return el.id ? `${tag}#${el.id}` : tag
}

function set(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

/** Write virtual halos as raw DOM nodes into the sentinel container. */
function syncSentinels(container: HTMLElement, halos: VirtualHalo[]) {
  container.replaceChildren(
    ...halos.map(h => {
      const el = document.createElement('div')
      el.setAttribute('data-halo', '')
      el.setAttribute('data-halo-rgb',     hexToRgb(h.hex))
      el.setAttribute('data-halo-opacity', (h.opacity / 100).toFixed(2))
      el.setAttribute('data-halo-w',       `${h.w}vw`)
      el.setAttribute('data-halo-h',       `${h.h}vh`)
      el.setAttribute('data-halo-spread',  `${h.spread}%`)
      if (h.anchor !== 'center') el.setAttribute('data-halo-anchor', h.anchor)
      Object.assign(el.style, {
        position:      'absolute',
        left:          `${h.x - h.w / 2}vw`,
        top:           `${h.y - h.h / 2}vh`,
        width:         `${h.w}vw`,
        height:        `${h.h}vh`,
        pointerEvents: 'none',
        visibility:    'hidden',
      })
      return el
    })
  )
}

/** Create a crosshair+circle pin element at viewport-relative (cx, cy). */
function createPin(cx: number, cy: number, label: string, color: string): HTMLElement {
  const dimColor = color.replace(/[\d.]+\)$/, '0.55)')

  const wrap = document.createElement('div')
  Object.assign(wrap.style, {
    position: 'absolute',
    left: cx + 'px', top: cy + 'px',
    transform: 'translate(-50%, -50%)',
    width: '0', height: '0',
    pointerEvents: 'none',
  })

  // Crosshair lines
  const hLine = document.createElement('div')
  Object.assign(hLine.style, {
    position: 'absolute', width: '18px', height: '1px',
    background: dimColor, top: '0', left: '-9px',
  })
  const vLine = document.createElement('div')
  Object.assign(vLine.style, {
    position: 'absolute', width: '1px', height: '18px',
    background: dimColor, left: '0', top: '-9px',
  })

  // Circle
  const circle = document.createElement('div')
  Object.assign(circle.style, {
    position: 'absolute',
    width: '8px', height: '8px',
    marginLeft: '-4px', marginTop: '-4px',
    borderRadius: '50%',
    border: `1.5px solid ${color}`,
    background: color.replace(/[\d.]+\)$/, '0.12)'),
    boxSizing: 'border-box',
  })
  const dot = document.createElement('div')
  Object.assign(dot.style, {
    position: 'absolute', width: '2px', height: '2px',
    borderRadius: '50%', background: color,
    top: '50%', left: '50%', marginLeft: '-1px', marginTop: '-1px',
  })
  circle.appendChild(dot)

  // Label
  const lbl = document.createElement('span')
  Object.assign(lbl.style, {
    position: 'absolute', left: '8px', top: '4px',
    fontSize: '9px', fontFamily: 'system-ui, sans-serif',
    fontWeight: '600', color,
    whiteSpace: 'nowrap', letterSpacing: '0.04em',
    textShadow: '0 1px 4px rgba(0,0,0,0.95)',
    lineHeight: '1',
  })
  lbl.textContent = label

  wrap.append(hLine, vLine, circle, lbl)
  return wrap
}

/** Rebuild pin overlays — called after every bg:rebuild, scroll, and resize. */
function buildPinsDOM(container: HTMLElement) {
  const sentinels = document.querySelector('[data-bg-sentinels]')
  let vIdx = 0

  const pins = Array.from(document.querySelectorAll<HTMLElement>('[data-halo]')).map(el => {
    const isVirtual = sentinels?.contains(el) ?? false
    const rect   = el.getBoundingClientRect()
    const anchor = el.dataset.haloAnchor ?? 'center'

    let cx: number, cy: number
    switch (anchor) {
      case 'top-left':     cx = rect.left;                cy = rect.top;               break
      case 'top-right':    cx = rect.right;               cy = rect.top;               break
      case 'bottom-left':  cx = rect.left;                cy = rect.bottom;            break
      case 'bottom-right': cx = rect.right;               cy = rect.bottom;            break
      default:             cx = rect.left + rect.width/2; cy = rect.top + rect.height/2
    }

    const label = isVirtual
      ? `V${++vIdx}`
      : (getLabel(el).split(' › ').pop() ?? '')

    const color = isVirtual
      ? 'rgba(100, 210, 255, 0.9)'   // cyan — virtual / sandbox
      : 'rgba(212, 172, 251, 0.9)'   // purple — real page element

    return createPin(Math.round(cx), Math.round(cy), label, color)
  })

  container.replaceChildren(...pins)
}

/** Collect all real [data-halo] elements on the page, excluding sentinel divs. */
function scanRealHalos(): RealHalo[] {
  const sentinelContainer = document.querySelector('[data-bg-sentinels]')
  return Array.from(document.querySelectorAll<HTMLElement>('[data-halo]'))
    .filter(el => !sentinelContainer?.contains(el))
    .map((el, i) => {
      const rgb    = el.dataset.haloRgb     ?? '212, 172, 251'
      const rawOp  = parseFloat(el.dataset.haloOpacity ?? '0.36')
      const w      = parseUnit(el.dataset.haloW      ?? '67vw')
      const h      = parseUnit(el.dataset.haloH      ?? '64vh')
      const spread = parseUnit(el.dataset.haloSpread ?? '1%')
      const anchor = (el.dataset.haloAnchor ?? 'center') as Anchor
      return {
        uid:     `real-${i}`,
        el,
        label:   getLabel(el),
        hex:     rgbToHex(rgb),
        opacity: Math.round(rawOp * 100),
        w, h, spread, anchor,
      }
    })
}

let nextId = 1

/* ── Component ───────────────────────────────────────────────────────────── */

export default function BgConfigurator() {
  const pathname = usePathname()

  const [visible, setVisible]       = useState(false)
  const [open, setOpen]             = useState(true)
  const [copied, setCopied]         = useState(false)
  const [copiedHalo, setCopiedHalo] = useState<number | null>(null)
  const [copiedRealHalo, setCopiedRealHalo] = useState<string | null>(null)
  const [pickingHaloId, setPickingHaloId]   = useState<number | null>(null)
  const [lightsOff, setLightsOff]           = useState(false)
  const [halosBrightness, setHalosBrightness] = useState(100)
  const copyTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const haloTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const realHaloTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef   = useRef<HTMLElement | null>(null)
  const pinsContainerRef = useRef<HTMLElement | null>(null)

  const [bgBase, setBgBase] = useState('#08080c')
  const [grain, setGrain]   = useState<Grain>({
    opacity: 100, freq: 110, oct: 3, blend: 'overlay',
  })
  const [halos, setHalos] = useState<VirtualHalo[]>([
    { id: nextId++, hex: '#D4ACFB', opacity: 0, x: 50, y: 163, w: 67, h: 64, spread: 1, anchor: 'center' },
  ])
  const [realHalos, setRealHalos] = useState<RealHalo[]>([])

  /* Apply grain vars + SVG attributes */
  const applyGrain = useCallback((next: Grain) => {
    set('--grain-opacity', (next.opacity / 100).toFixed(2))
    set('--grain-blend',   next.blend)
    const turb = document.getElementById('grain-turbulence')
    if (turb) {
      turb.setAttribute('baseFrequency', (next.freq / 100).toFixed(2))
      turb.setAttribute('numOctaves',    String(next.oct))
    }
  }, [])

  /* ── H key : toggle panel visibility ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'h' || e.key === 'H') setVisible(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── Scan real halos when panel becomes visible or route changes ── */
  useEffect(() => {
    if (!visible) return
    // Defer one frame so the DOM/layout is committed before reading halo rects
    const id = requestAnimationFrame(() => setRealHalos(scanRealHalos()))
    return () => cancelAnimationFrame(id)
  }, [visible, pathname])

  /* ── Mount: create raw DOM pins overlay (fixed, viewport-relative) ── */
  useEffect(() => {
    document.querySelectorAll('[data-bg-pins]').forEach(el => el.remove())
    const c = document.createElement('div')
    c.setAttribute('data-bg-pins', '')
    Object.assign(c.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '99997',
    })
    document.body.appendChild(c)
    pinsContainerRef.current = c
    return () => { c.remove(); pinsContainerRef.current = null }
  }, [])

  /* ── Rebuild pins on bg:rebuild, scroll, resize, or visibility toggle ── */
  useEffect(() => {
    let rafId: number | null = null

    function schedule() {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const c = pinsContainerRef.current
        if (!c) return
        if (!visible) { c.replaceChildren(); return }
        buildPinsDOM(c)
      })
    }

    schedule()
    window.addEventListener('bg:rebuild', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('bg:rebuild', schedule)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [visible])

  /* ── Mount: create raw DOM sentinel container (no React portal) ── */
  useEffect(() => {
    document.querySelectorAll('[data-bg-sentinels]').forEach(el => el.remove())

    const container = document.createElement('div')
    container.setAttribute('data-bg-sentinels', '')
    // Sentinels exist only to be measured (getBoundingClientRect). Keep them out
    // of layout/scroll: a 0×0 clipped box at the document origin preserves their
    // document coordinates without ever extending the page height (a halo placed
    // far down would otherwise add scroll on short pages).
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    })
    document.body.appendChild(container)
    containerRef.current = container

    set('--bg-base', bgBase)
    set('--halos-master-opacity', '1')
    applyGrain(grain)

    return () => {
      container.remove()
      containerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Sync sentinel DOM nodes + trigger BgHalos rebuild on halo changes ── */
  useEffect(() => {
    if (!containerRef.current) return
    syncSentinels(containerRef.current, halos)
    window.dispatchEvent(new Event('bg:rebuild'))
  }, [halos])

  function updBgBase(hex: string) {
    setBgBase(hex)
    set('--bg-base', hex)
  }

  function updGrain<K extends keyof Grain>(key: K, val: Grain[K]) {
    const next = { ...grain, [key]: val }
    setGrain(next)
    applyGrain(next)
  }

  function updHalo<K extends keyof VirtualHalo>(id: number, key: K, val: VirtualHalo[K]) {
    setHalos(prev => prev.map(h => h.id === id ? { ...h, [key]: val } : h))
  }

  /** Update a real (page) halo: writes attributes directly to the live DOM element. */
  function updRealHalo(uid: string, key: RealHaloEditKey, val: RealHalo[RealHaloEditKey]) {
    setRealHalos(prev => prev.map(rh => {
      if (rh.uid !== uid) return rh
      const next = { ...rh, [key]: val } as RealHalo
      next.el.setAttribute('data-halo-rgb',     hexToRgb(next.hex))
      next.el.setAttribute('data-halo-opacity',  (next.opacity / 100).toFixed(2))
      next.el.setAttribute('data-halo-w',        `${next.w}vw`)
      next.el.setAttribute('data-halo-h',        `${next.h}vh`)
      next.el.setAttribute('data-halo-spread',   `${next.spread}%`)
      if (next.anchor !== 'center') next.el.setAttribute('data-halo-anchor', next.anchor)
      else                          next.el.removeAttribute('data-halo-anchor')
      window.dispatchEvent(new Event('bg:rebuild'))
      return next
    }))
  }

  function copyRealHaloAttrs(rh: RealHalo) {
    const attrs = [
      `data-halo`,
      `data-halo-rgb="${hexToRgb(rh.hex)}"`,
      `data-halo-opacity="${(rh.opacity / 100).toFixed(2)}"`,
      `data-halo-w="${rh.w}vw"`,
      `data-halo-h="${rh.h}vh"`,
      `data-halo-spread="${rh.spread}%"`,
      ...(rh.anchor !== 'center' ? [`data-halo-anchor="${rh.anchor}"`] : []),
    ].join('\n  ')
    navigator.clipboard.writeText(attrs).catch(() => {})
    if (realHaloTimer.current) clearTimeout(realHaloTimer.current)
    setCopiedRealHalo(rh.uid)
    realHaloTimer.current = setTimeout(() => setCopiedRealHalo(null), 2000)
  }

  function addHalo() {
    setHalos(prev => [...prev, {
      id: nextId++, hex: '#D4ACFB', opacity: 30, x: 50, y: 300, w: 60, h: 60, spread: 1, anchor: 'center',
    }])
  }

  function removeHalo(id: number) {
    setHalos(prev => prev.filter(h => h.id !== id))
  }

  function copyHaloAttrs(h: VirtualHalo) {
    const attrs = [
      `data-halo`,
      `data-halo-rgb="${hexToRgb(h.hex)}"`,
      `data-halo-opacity="${(h.opacity / 100).toFixed(2)}"`,
      `data-halo-w="${h.w}vw"`,
      `data-halo-h="${h.h}vh"`,
      `data-halo-spread="${h.spread}%"`,
      ...(h.anchor !== 'center' ? [`data-halo-anchor="${h.anchor}"`] : []),
    ].join('\n  ')
    navigator.clipboard.writeText(attrs).catch(() => {})
    if (haloTimer.current) clearTimeout(haloTimer.current)
    setCopiedHalo(h.id)
    haloTimer.current = setTimeout(() => setCopiedHalo(null), 2000)
  }

  /* ── Pick mode — click an element to set halo x/y ── */
  useEffect(() => {
    if (pickingHaloId === null) return

    document.body.style.cursor = 'crosshair'

    const hl = document.createElement('div')
    hl.style.cssText = [
      'position:fixed', 'pointer-events:none', 'z-index:99998',
      'border:2px solid rgba(212,172,251,0.9)',
      'background:rgba(212,172,251,0.08)',
      'transition:all 0.08s ease', 'display:none',
    ].join(';')
    document.body.appendChild(hl)

    function onMove(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || el === hl) return
      const r = el.getBoundingClientRect()
      hl.style.display = 'block'
      hl.style.left    = r.left   + 'px'
      hl.style.top     = r.top    + 'px'
      hl.style.width   = r.width  + 'px'
      hl.style.height  = r.height + 'px'
    }

    function onClick(e: MouseEvent) {
      const panel = document.querySelector('[data-bg-configurator]')
      if (panel?.contains(e.target as Node)) return

      e.preventDefault()
      e.stopPropagation()

      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el && el !== hl) {
        const r    = el.getBoundingClientRect()
        const docX = r.left + window.scrollX + r.width  / 2
        const docY = r.top  + window.scrollY + r.height / 2
        const x = Math.round((docX / window.innerWidth)  * 100)
        const y = Math.round((docY / window.innerHeight) * 100)
        setHalos(prev => prev.map(h => h.id === pickingHaloId ? { ...h, x, y } : h))
      }
      setPickingHaloId(null)
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickingHaloId(null)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey)
      document.body.style.cursor = ''
      hl.remove()
    }
  }, [pickingHaloId])

  function updHalosBrightness(val: number) {
    setHalosBrightness(val)
    set('--halos-master-opacity', (val / 100).toFixed(2))
    window.dispatchEvent(new Event('bg:rebuild'))
  }

  function toggleLights() {
    const layer = document.querySelector<HTMLElement>('[data-bg-halos-layer]')
    if (lightsOff) {
      if (layer) layer.style.opacity = '1'
      set('--grain-opacity', (grain.opacity / 100).toFixed(2))
    } else {
      if (layer) layer.style.opacity = '0'
      set('--grain-opacity', '0')
    }
    setLightsOff(v => !v)
  }

  function exportCss() {
    const css = `/* ── Background Canvas ── */
:root {
  --bg-base:       ${bgBase};
  --grain-opacity: ${(grain.opacity / 100).toFixed(2)};
  --grain-blend:   ${grain.blend};
}`
    navigator.clipboard.writeText(css).catch(() => {})
    if (copyTimer.current) clearTimeout(copyTimer.current)
    setCopied(true)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  const hasRealHalos = realHalos.length > 0

  /* ── Render ── */
  if (!visible) return null

  return (
    <div className={styles.panel} data-bg-configurator>
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <span className={styles.title}>⚙ BG</span>
        <span className={`${styles.toggle} ${open ? '' : styles.collapsed}`}>︿</span>
      </div>

      {open && (
        <div className={styles.body}>

          {/* ── Background ── */}
          <Section label="Background">
            <Row label="Couleur">
              <input type="color" className={styles.colorInput} value={bgBase}
                onChange={e => updBgBase(e.target.value)} />
              <span className={styles.val}>{bgBase}</span>
            </Row>
          </Section>

          {/* ── Halos de page (real DOM elements) ── */}
          {hasRealHalos && (
            <>
              <p className={styles.groupLabel}>Halos de page</p>
              {realHalos.map(rh => (
                <Section key={rh.uid} label={rh.label}>
                  <Row label="Couleur">
                    <input type="color" className={styles.colorInput} value={rh.hex}
                      onChange={e => updRealHalo(rh.uid, 'hex', e.target.value)} />
                    <span className={styles.val}>{rh.hex}</span>
                  </Row>
                  <Slider label="Opacité"   val={rh.opacity} min={0}  max={100} unit="%" onChange={v => updRealHalo(rh.uid, 'opacity', v)} />
                  <Slider label="Largeur"   val={rh.w}       min={10} max={250} unit="vw" onChange={v => updRealHalo(rh.uid, 'w', v)} />
                  <Slider label="Hauteur"   val={rh.h}       min={10} max={200} unit="vh" onChange={v => updRealHalo(rh.uid, 'h', v)} />
                  <Slider label="Diffusion" val={rh.spread}  min={1}  max={80}  unit="%" onChange={v => updRealHalo(rh.uid, 'spread', v)} />
                  <Row label="Ancre">
                    <select className={styles.select} value={rh.anchor}
                      onChange={e => updRealHalo(rh.uid, 'anchor', e.target.value as Anchor)}>
                      <option value="center">Centre</option>
                      <option value="top-left">↖ Haut-Gauche</option>
                      <option value="top-right">↗ Haut-Droite</option>
                      <option value="bottom-left">↙ Bas-Gauche</option>
                      <option value="bottom-right">↘ Bas-Droite</option>
                    </select>
                  </Row>
                  <button className={styles.copyHaloBtn} onClick={() => copyRealHaloAttrs(rh)}>
                    {copiedRealHalo === rh.uid ? '✓ Copié !' : 'Copier data-halo'}
                  </button>
                </Section>
              ))}
              <button className={styles.rescanBtn} onClick={() => setRealHalos(scanRealHalos())}>
                ↺ Rescanner la page
              </button>
            </>
          )}

          {/* ── Halos virtuels (sandbox / simulator) ── */}
          {hasRealHalos && <p className={styles.groupLabel}>Halos virtuels</p>}
          {halos.map((h, i) => (
            <Section key={h.id} label={`Halo ${i + 1}`}>
              <Row label="Couleur">
                <input type="color" className={styles.colorInput} value={h.hex}
                  onChange={e => updHalo(h.id, 'hex', e.target.value)} />
                <span className={styles.val}>{h.hex}</span>
              </Row>
              <Slider label="Opacité"   val={h.opacity} min={0}   max={100} unit="%" onChange={v => updHalo(h.id, 'opacity', v)} />
              <Slider label="X"         val={h.x}       min={0}   max={100} unit="vw" onChange={v => updHalo(h.id, 'x', v)} />
              <Slider label="Y"         val={h.y}       min={0}   max={800} unit="vh" onChange={v => updHalo(h.id, 'y', v)} />
              <Slider label="Largeur"   val={h.w}       min={10}  max={250} unit="vw" onChange={v => updHalo(h.id, 'w', v)} />
              <Slider label="Hauteur"   val={h.h}       min={10}  max={200} unit="vh" onChange={v => updHalo(h.id, 'h', v)} />
              <Slider label="Diffusion" val={h.spread}  min={1}   max={80}  unit="%" onChange={v => updHalo(h.id, 'spread', v)} />
              <Row label="Ancre">
                <select
                  className={styles.select}
                  value={h.anchor}
                  onChange={e => updHalo(h.id, 'anchor', e.target.value as Anchor)}
                >
                  <option value="center">Centre</option>
                  <option value="top-left">↖ Haut-Gauche</option>
                  <option value="top-right">↗ Haut-Droite</option>
                  <option value="bottom-left">↙ Bas-Gauche</option>
                  <option value="bottom-right">↘ Bas-Droite</option>
                </select>
              </Row>
              <button
                className={`${styles.copyHaloBtn} ${pickingHaloId === h.id ? styles.copyHaloBtnActive : ''}`}
                onClick={() => setPickingHaloId(id => id === h.id ? null : h.id)}
              >
                {pickingHaloId === h.id ? '⊕ Cliquer un élément…' : '⊕ Sélectionner'}
              </button>
              <button className={styles.copyHaloBtn} onClick={() => copyHaloAttrs(h)}>
                {copiedHalo === h.id ? '✓ Copié !' : 'Copier data-halo'}
              </button>
              {halos.length > 1 && (
                <button className={styles.removeBtn} onClick={() => removeHalo(h.id)}>
                  − Supprimer
                </button>
              )}
            </Section>
          ))}

          <button className={styles.addBtn} onClick={addHalo}>
            + Ajouter un halo
          </button>

          {/* ── Grain ── */}
          <Section label="Grain" last>
            <Slider label="Intensité" val={grain.opacity} min={0}  max={100} unit="%" onChange={v => updGrain('opacity', v)} />
            <Slider label="Fréquence" val={grain.freq}    min={10} max={150} unit="" fmt={v => (v / 100).toFixed(2)} onChange={v => updGrain('freq', v)} />
            <Slider label="Octaves"   val={grain.oct}     min={1}  max={8}   unit="" onChange={v => updGrain('oct', v)} />
            <Row label="Blend">
              <select className={styles.select}
                value={grain.blend}
                onChange={e => updGrain('blend', e.target.value)}
              >
                {['luminosity','overlay','soft-light','screen','multiply','color-dodge','hard-light','normal'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Row>
          </Section>

          <div className={styles.brightnessRow}>
            <Slider
              label="Luminosité"
              val={halosBrightness}
              min={0} max={100} unit="%"
              onChange={updHalosBrightness}
            />
          </div>

          <button
            className={`${styles.lightsBtn} ${lightsOff ? styles.lightsBtnOff : ''}`}
            onClick={toggleLights}
          >
            {lightsOff ? '☀ Allumer' : '☽ Couper les lumières'}
          </button>

          <button className={styles.exportBtn} onClick={exportCss}>
            {copied ? '✓ Copié !' : 'Copier le CSS'}
          </button>

        </div>
      )}
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Section({ label, children, last = false }: {
  label: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div className={`${styles.section} ${last ? styles.sectionLast : ''}`}>
      <p className={styles.sectionTitle}>{label}</p>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}

function Slider({ label, val, min, max, unit, fmt, onChange }: {
  label: string
  val: number
  min: number
  max: number
  unit: string
  fmt?: (v: number) => string
  onChange: (v: number) => void
}) {
  const display = fmt ? fmt(val) : `${val}${unit}`
  return (
    <div className={styles.row}>
      <label className={styles.label}>{label}</label>
      <input
        type="range"
        className={styles.range}
        min={min} max={max} value={val}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className={styles.val}>{display}</span>
    </div>
  )
}
