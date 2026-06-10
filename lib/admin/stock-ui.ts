// Pure inventory helpers for the stock table — framework-free so they can be
// unit-tested without rendering the component.

export type StockStatus = 'out' | 'low' | 'ok'
export type StockFilter = 'all' | 'low' | 'out'

/** Inventory status for a quantity against the low-stock threshold. */
export function stockStatus(value: number, lowThreshold: number): StockStatus {
  if (value === 0) return 'out'
  if (value <= lowThreshold) return 'low'
  return 'ok'
}

/** Coerce a raw numeric input into a non-negative integer stock value. */
export function clampStock(next: number): number {
  return Math.max(0, Math.trunc(next) || 0)
}

/** Whether a row passes the active stock filter. */
export function matchesStockFilter(stock: number, filter: StockFilter, lowThreshold: number): boolean {
  if (filter === 'all') return true
  if (filter === 'low') return stock > 0 && stock <= lowThreshold
  return stock === 0 // 'out'
}

/** Whether a row matches the (trimmed, case-insensitive) search query. */
export function matchesStockSearch(row: { productName: string; sku: string }, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return row.productName.toLowerCase().includes(needle) || row.sku.toLowerCase().includes(needle)
}
