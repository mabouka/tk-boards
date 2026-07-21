import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines, users, variants, products } from '@/db/schema'
import { fullName } from './format'

export type PickVariant = { id: string; sku: string; label: string; priceEur: string; stock: number }

/** Active variants for the manual-order picker (product name + SKU + price). */
export async function getPickableVariants(): Promise<PickVariant[]> {
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      stock: variants.stock,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(and(eq(variants.active, true), eq(products.active, true)))
    .orderBy(products.name, variants.sortOrder)

  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    label: `${r.productName} — ${r.sku}`,
    priceEur: r.salePriceEur ?? r.priceEur,
    stock: r.stock,
  }))
}

export type AdminOrderRow = {
  id: string
  number: string
  customer: string
  email: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalEur: string
  createdAt: Date
  itemCount: number
}

export async function getOrders(): Promise<AdminOrderRow[]> {
  const rows = await db
    .select({
      id: orders.id,
      number: orders.number,
      email: orders.email,
      firstName: users.firstName,
      lastName: users.lastName,
      name: users.name,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      totalEur: orders.totalEur,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(select coalesce(sum(${orderLines.qty}), 0) from ${orderLines} where ${orderLines.orderId} = ${orders.id})::int`,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))

  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    email: r.email,
    customer: fullName(r.firstName, r.lastName, r.name) || r.email,
    status: r.status,
    paymentMethod: r.paymentMethod,
    paymentStatus: r.paymentStatus,
    totalEur: r.totalEur,
    createdAt: r.createdAt,
    itemCount: r.itemCount,
  }))
}

export async function getAdminOrder(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) return null

  const lines = await db
    .select({
      productName: orderLines.productName,
      variantSku: orderLines.variantSku,
      variantLabel: orderLines.variantLabel,
      unitPriceEur: orderLines.unitPriceEur,
      qty: orderLines.qty,
    })
    .from(orderLines)
    .where(eq(orderLines.orderId, id))

  let customerName: string | null = null
  if (order.userId) {
    const [u] = await db
      .select({ firstName: users.firstName, lastName: users.lastName, name: users.name })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1)
    if (u) customerName = fullName(u.firstName, u.lastName, u.name)
  }

  return { order, lines, customerName }
}
