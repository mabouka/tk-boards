'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

const STATUSES = [
  'pending_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof STATUSES)[number]

type Result = { ok: true } | { ok: false; error: string }

function revalidate(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<Result> {
  await requireAdmin()
  if (!orderId || !STATUSES.includes(status)) return { ok: false, error: 'Statut invalide.' }

  await db
    .update(orders)
    .set({
      status,
      ...(status === 'shipped' ? { shippedAt: new Date() } : {}),
      ...(status === 'paid' ? { paymentStatus: 'paid' as const, paidAt: new Date() } : {}),
      ...(status === 'refunded' ? { paymentStatus: 'refunded' as const } : {}),
    })
    .where(eq(orders.id, orderId))
  revalidate(orderId)
  return { ok: true }
}

// Cash/transfer orders: the admin confirms the payment was received.
export async function markPaid(orderId: string): Promise<Result> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Commande introuvable.' }

  await db
    .update(orders)
    .set({ paymentStatus: 'paid', paidAt: new Date(), status: 'paid' })
    .where(eq(orders.id, orderId))
  revalidate(orderId)
  return { ok: true }
}
