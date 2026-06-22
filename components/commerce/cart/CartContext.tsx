'use client'

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react'
import type { CartLine } from './CartModal'

const STORAGE_KEY = 'tk-cart'
const EMPTY: CartLine[] = []

// ── Module-level cart store (persisted to localStorage) ──
// Read via useSyncExternalStore so there's no setState-in-effect; the load runs
// lazily on first subscribe (client only), and getServerSnapshot stays stable
// for SSR. Lines are keyed by variant SKU (`id`).
let items: CartLine[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function isCartLine(l: unknown): l is CartLine {
  return (
    typeof l === 'object' &&
    l !== null &&
    typeof (l as CartLine).id === 'string' &&
    typeof (l as CartLine).price === 'number' &&
    typeof (l as CartLine).qty === 'number'
  )
}

function loadOnce() {
  if (loaded) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    // Validate shape: a non-array or malformed lines (old schema, manual edit,
    // another tab on the same origin) would otherwise crash count/total → the
    // whole CartProvider subtree (header + page + drawer).
    if (Array.isArray(parsed)) items = parsed.filter(isCartLine)
  } catch {
    /* ignore malformed storage */
  }
}

/** Clamp a quantity to [1, maxQty]; uncapped when maxQty is absent (<1 ignored). */
function clampQty(qty: number, maxQty?: number): number {
  const q = Math.max(1, qty)
  return maxQty != null && maxQty >= 1 ? Math.min(q, maxQty) : q
}

function commit(next: CartLine[]) {
  items = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* storage full / unavailable — ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  loadOnce()
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
const getSnapshot = () => items
const getServerSnapshot = () => EMPTY

function addToStore(item: CartLine) {
  const qty = item.qty || 1
  const i = items.findIndex((l) => l.id === item.id)
  if (i === -1) commit([...items, { ...item, qty: clampQty(qty, item.maxQty) }])
  else {
    const next = [...items]
    // Refresh the stock cap from the latest add, then clamp the bumped quantity.
    const maxQty = item.maxQty ?? next[i].maxQty
    next[i] = { ...next[i], maxQty, qty: clampQty(next[i].qty + qty, maxQty) }
    commit(next)
  }
}

type CartContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  items: CartLine[]
  addItem: (item: CartLine) => void
  setQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clear: () => void
  count: number
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addItem = useCallback((item: CartLine) => {
    addToStore(item)
    setOpen(true)
  }, [])
  const setQty = useCallback((id: string, qty: number) => {
    commit(items.map((l) => (l.id === id ? { ...l, qty: clampQty(qty, l.maxQty) } : l)))
  }, [])
  const removeItem = useCallback((id: string) => {
    commit(items.filter((l) => l.id !== id))
  }, [])
  const clear = useCallback(() => commit([]), [])

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines])
  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines])

  return (
    <CartContext.Provider
      value={{ open, setOpen, items: lines, addItem, setQty, removeItem, clear, count, total }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
