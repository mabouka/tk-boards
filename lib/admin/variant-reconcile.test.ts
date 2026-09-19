import { describe, expect, it } from 'vitest'
import { planVariantReconciliation, type ExistingVariant } from './variant-reconcile'

const existing: ExistingVariant[] = [
  { id: 'v-s', sku: 'BX-S' },
  { id: 'v-m', sku: 'BX-M' },
]

describe('planVariantReconciliation', () => {
  it('reuses matched SKUs (update in place) and flags new SKUs for insert', () => {
    const plan = planVariantReconciliation(existing, ['BX-S', 'BX-M', 'BX-L'], new Set())
    expect(plan.reuseIdBySku.get('BX-S')).toBe('v-s')
    expect(plan.reuseIdBySku.get('BX-M')).toBe('v-m')
    expect(plan.reuseIdBySku.has('BX-L')).toBe(false) // new → insert
    expect(plan.archive).toEqual([])
    expect(plan.delete).toEqual([])
  })

  it('hard-deletes a dropped SKU that has no references', () => {
    const plan = planVariantReconciliation(existing, ['BX-S'], new Set()) // BX-M dropped, no units
    expect(plan.reuseIdBySku.get('BX-S')).toBe('v-s')
    expect(plan.delete).toEqual(['v-m'])
    expect(plan.archive).toEqual([])
  })

  it('archives a dropped SKU that still has units/orders (never orphan a board)', () => {
    const plan = planVariantReconciliation(existing, ['BX-S'], new Set(['v-m'])) // BX-M has a unit
    expect(plan.archive).toEqual(['v-m'])
    expect(plan.delete).toEqual([])
  })

  it('reuses an id even when referenced — a still-wanted SKU is never archived', () => {
    const plan = planVariantReconciliation(existing, ['BX-S', 'BX-M'], new Set(['v-s', 'v-m']))
    expect(plan.reuseIdBySku.get('BX-S')).toBe('v-s')
    expect(plan.reuseIdBySku.get('BX-M')).toBe('v-m')
    expect(plan.archive).toEqual([])
    expect(plan.delete).toEqual([])
  })

  it('handles a first save (no existing variants)', () => {
    const plan = planVariantReconciliation([], ['BX-S'], new Set())
    expect(plan.reuseIdBySku.size).toBe(0)
    expect(plan.archive).toEqual([])
    expect(plan.delete).toEqual([])
  })

  it('splits a mix of kept, new, deleted and archived', () => {
    const rows: ExistingVariant[] = [
      { id: 'v-s', sku: 'BX-S' }, // kept
      { id: 'v-m', sku: 'BX-M' }, // dropped, unreferenced → delete
      { id: 'v-l', sku: 'BX-L' }, // dropped, referenced → archive
    ]
    const plan = planVariantReconciliation(rows, ['BX-S', 'BX-XL'], new Set(['v-l']))
    expect(plan.reuseIdBySku.get('BX-S')).toBe('v-s')
    expect(plan.reuseIdBySku.has('BX-XL')).toBe(false)
    expect(plan.delete).toEqual(['v-m'])
    expect(plan.archive).toEqual(['v-l'])
  })
})
