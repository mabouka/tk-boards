import { buildGrid, comboKey, type GenOption } from './variants'

// Per-combo overrides captured in the editor grid (empty string = "use base").
export type Override = { price: string; sale: string; active: boolean }

export type VariantDraft = {
  sku: string
  combo: Record<string, string>
  priceEur: string
  salePriceEur: string | null
  active: boolean
}

/**
 * Build the variant rows from the editor state. A product with no axes yields a
 * single variant whose SKU *is* the parent SKU; a configurable one yields the
 * cartesian grid with child SKUs `PARENT-CODE-CODE…`. A per-combo override wins
 * over the base price/sale; an empty override field falls back to the base. The
 * child SKU is the key that links a variant to its inventory + Sanity page, so
 * its shape must stay stable.
 */
export function buildVariants(args: {
  sku: string
  options: GenOption[]
  overrides: Record<string, Override>
  basePrice: string
  discount: string
}): VariantDraft[] {
  const { sku, options, overrides, basePrice, discount } = args

  if (options.length === 0) {
    return [{ sku, combo: {}, priceEur: basePrice, salePriceEur: discount || null, active: true }]
  }

  return buildGrid(options).map((row) => {
    const ov = overrides[comboKey(options, row.pick)]
    return {
      sku: [sku, ...row.cells.map((c) => c.code)].join('-'),
      combo: row.pick,
      priceEur: ov?.price || basePrice,
      salePriceEur: (ov?.sale || discount) || null,
      active: ov?.active ?? true,
    }
  })
}
