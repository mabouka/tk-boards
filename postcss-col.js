/**
 * PostCSS plugin: col(n)
 * col(n) → calc(n * (var(--col-width) + var(--col-gutter)) - var(--col-gutter))
 *
 * Usage: width: col(3);  →  3 colonnes de large
 */

/** @type {() => import('postcss').Plugin} */
const plugin = () => ({
  postcssPlugin: 'postcss-col',
  Declaration(decl) {
    if (!decl.value.includes('col(')) return
    decl.value = decl.value.replace(
      /\bcol\((\d+)\)/g,
      (_, n) =>
        `calc(${n} * (var(--col-width) + var(--col-gutter)) - var(--col-gutter))`
    )
  },
})

plugin.postcss = true
module.exports = plugin
