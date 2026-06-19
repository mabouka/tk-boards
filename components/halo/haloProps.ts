import type { HTMLAttributes } from 'react'

export type HaloAttrs = {
  /** "r, g, b" */
  rgb?: string
  opacity?: number | string
  /** gradient width, e.g. "42vw" */
  w?: string
  /** gradient height, e.g. "39vh" */
  h?: string
  /** inner colour stop (where the fade starts), e.g. "1%" */
  spread?: string
  /** where on the parent the halo anchors before any x/y offset */
  anchor?: string
  x?: string
  y?: string
}

/**
 * `data-*` attributes read by the global BgHalos background layer to paint a glow
 * positioned at this element. Spread onto any element:
 *
 *   <section {...haloProps({ rgb: '225, 255, 255', opacity: 0.23, w: '42vw', h: '39vh', spread: '1%' })}>
 *
 * Single source of truth for the attribute names. Omitted fields render no
 * attribute (BgHalos applies its own defaults). Typed as `HTMLAttributes` so it
 * spreads onto intrinsic elements — @types/react has no `data-*` index signature.
 */
export function haloProps(h: HaloAttrs): HTMLAttributes<HTMLElement> {
  return {
    'data-halo': true,
    'data-halo-rgb': h.rgb,
    'data-halo-opacity': h.opacity != null ? String(h.opacity) : undefined,
    'data-halo-w': h.w,
    'data-halo-h': h.h,
    'data-halo-spread': h.spread,
    'data-halo-anchor': h.anchor,
    'data-halo-x': h.x,
    'data-halo-y': h.y,
  } as unknown as HTMLAttributes<HTMLElement>
}
