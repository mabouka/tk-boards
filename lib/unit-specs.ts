// Physical snapshot of what a produced unit IS, captured at assignment time and
// stored on the unit (unit.specs jsonb). Self-contained: it keeps the stable
// CODE and the display LABEL for each axis, so a board's identity survives later
// catalogue changes — a renamed SKU, an archived variant, or a new axis added.
// Pure assembly/formatting here; the DB read lives in the units action (Layer 3).

export type UnitSpecAxis = {
  /** Stable attribute code, e.g. "COLOR" (survives label/SKU renames). */
  code: string
  /** Display name captured at the time, e.g. "Couleur". */
  name: string
  /** Stable value code, e.g. "MAGENTA". */
  value: string
  /** Display label captured at the time, e.g. "Magenta". */
  label: string
}

export type UnitSpecs = {
  /** Parent product SKU at capture, e.g. "TK-RKT". */
  modelSku: string
  axes: UnitSpecAxis[]
}

/** Assemble a deterministic snapshot: drop axes missing a code/value, order by
 *  code so the stored JSON is stable regardless of query order. */
export function buildSpecs(modelSku: string, axes: UnitSpecAxis[]): UnitSpecs {
  const clean = axes
    .filter((a) => a.code && a.value)
    .map((a) => ({ code: a.code, name: a.name, value: a.value, label: a.label }))
    .sort((a, b) => a.code.localeCompare(b.code))
  return { modelSku, axes: clean }
}

/** Human-readable axes for display fallback, e.g. "Couleur : Magenta · Taille : 138 cm".
 *  Falls back to the value code when a label is missing. */
export function describeSpecs(specs: UnitSpecs | null | undefined, sep = ' · '): string {
  if (!specs?.axes?.length) return ''
  return specs.axes.map((a) => `${a.name} : ${a.label || a.value}`).join(sep)
}
