// Pure helpers for the variant editor: code slugging, axis de-duplication, and
// the cartesian product of option values → variant grid. Kept framework-free so
// they can be unit-tested in isolation (no React, no DB).

export type GenValue = { code: string }
export type GenOption = { code: string; values: GenValue[] }

/** Normalize a free-text label into a stable uppercase ASCII code (SIZE, BLEU…). */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
}

/** Stable key for a variant from its axis picks, e.g. "SIZE:M|COLOR:BLUE". */
export function comboKey(opts: GenValue[], pick: Record<string, string>): string {
  return opts.map((o) => `${o.code}:${pick[o.code]}`).join('|')
}

export type GridRow<V> = { pick: Record<string, string>; cells: V[] }

/** Cartesian product of every axis' values → one row per variant. */
export function buildGrid<V extends GenValue>(
  opts: { code: string; values: V[] }[]
): GridRow<V>[] {
  if (opts.length === 0) return []
  let rows: GridRow<V>[] = [{ pick: {}, cells: [] }]
  for (const opt of opts) {
    const next: GridRow<V>[] = []
    for (const row of rows) {
      for (const val of opt.values) {
        next.push({ pick: { ...row.pick, [opt.code]: val.code }, cells: [...row.cells, val] })
      }
    }
    rows = next
  }
  return rows
}

/**
 * Drop incomplete axes (no code, or no value with a code) and guarantee unique
 * codes across axes AND within each axis' values, so combos, SKUs and React keys
 * never collide — even mid-edit with two same-named axes.
 */
export function dedupeOptions<O extends GenOption>(options: O[]): O[] {
  const seenOpt = new Map<string, number>()
  return options
    .filter((o) => o.code && o.values.some((v) => v.code))
    .map((o) => {
      const n = seenOpt.get(o.code) ?? 0
      seenOpt.set(o.code, n + 1)
      const code = n === 0 ? o.code : `${o.code}-${n + 1}`
      const seenVal = new Map<string, number>()
      const values = o.values
        .filter((v) => v.code)
        .map((v) => {
          const vn = seenVal.get(v.code) ?? 0
          seenVal.set(v.code, vn + 1)
          return vn === 0 ? v : { ...v, code: `${v.code}-${vn + 1}` }
        })
      return { ...o, code, values } as O
    })
}
