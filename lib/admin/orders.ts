import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines, users } from '@/db/schema'
import { fullName } from './format'

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
