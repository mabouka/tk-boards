import styles from './Halos.module.css'

export type HaloAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type Halo = {
  /** "r, g, b" */
  rgb?: string
  opacity?: number
  /** gradient size, e.g. "65vw" */
  w?: string
  /** gradient size, e.g. "65vh" */
  h?: string
  /** inner colour stop (where the fade starts), e.g. "1%" */
  spread?: string
  /** where on the parent the halo is anchored before the x/y offset */
  anchor?: HaloAnchor
  /** offset from the anchor, any CSS length — e.g. "10vw", "-5vw" */
  x?: string
  /** offset from the anchor, any CSS length — e.g. "100vh", "200vh" */
  y?: string
}

const ANCHORS: Record<HaloAnchor, { left: string; top: string }> = {
  center: { left: '50%', top: '50%' },
  top: { left: '50%', top: '0%' },
  bottom: { left: '50%', top: '100%' },
  left: { left: '0%', top: '50%' },
  right: { left: '100%', top: '50%' },
  'top-left': { left: '0%', top: '0%' },
  'top-right': { left: '100%', top: '0%' },
  'bottom-left': { left: '0%', top: '100%' },
  'bottom-right': { left: '100%', top: '100%' },
}

function haloStyle(h: Halo): React.CSSProperties {
  const a = ANCHORS[h.anchor ?? 'center']
  return {
    left: h.x ? `calc(${a.left} + ${h.x})` : a.left,
    top: h.y ? `calc(${a.top} + ${h.y})` : a.top,
    width: h.w ?? '67vw',
    height: h.h ?? '64vh',
    ['--halo-rgb' as string]: h.rgb ?? '212, 172, 251',
    ['--halo-op' as string]: String(h.opacity ?? 0.36),
    ['--halo-spread' as string]: h.spread ?? '1%',
  } as React.CSSProperties
}

/**
 * Local halos — radial-gradient glows rendered as DOM children of a section, so
 * they move WITH it (works on pinned/sticky GSAP sections, unlike the global
 * doc-anchored data-halo system). Pass an array; each halo has its own colour,
 * size, anchor, and x/y offset (e.g. y: "100vh" / "200vh") so several halos sit
 * at different depths down a tall section. Pure CSS — no JS.
 *
 * The parent must be `position: relative` (or any positioning context).
 */
export default function Halos({ halos }: { halos: Halo[] }) {
  if (!halos?.length) return null
  return (
    <div className={styles.halos} aria-hidden="true">
      {halos.map((h, i) => (
        <span key={i} className={styles.halo} style={haloStyle(h)} />
      ))}
    </div>
  )
}
