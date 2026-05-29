import styles from './BackgroundCanvas.module.css'

/**
 * Fixed background layer: dark base + two radial halos + SVG film grain.
 * All parameters are driven by CSS custom properties so BgConfigurator
 * (dev-only client component) can tweak them live via setProperty().
 */
export default function BackgroundCanvas() {
  return (
    <>
      {/* SVG grain filter — must live in the DOM to be referenced by filter: url(#…) */}
      <svg
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id="grain-filter"
            x="0%" y="0%"
            width="100%" height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              id="grain-turbulence"
              type="fractalNoise"
              baseFrequency="1.10"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            {/* Gamma > 1 biases the noise toward dark values (film-grain look) */}
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent="2.5" offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent="2.5" offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent="2.5" offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Fixed canvas: bg-color + halos (background-image set by BgHalos) */}
      <div className={styles.bgCanvas} data-bg-canvas aria-hidden="true">
        {/* Halo layer — background-image + opacity managed by BgHalos */}
        <div className={styles.bgHalosLayer} data-bg-halos-layer />
        {/* Film grain overlay */}
        <div className={styles.bgGrain} />
      </div>
    </>
  )
}
