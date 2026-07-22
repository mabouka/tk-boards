import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines } from '@/db/schema'
import InvoiceDocument, { type InvoiceData, type InvoiceParty } from '@/invoices/InvoiceDocument'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { companySettingsQuery } from '@/sanity/lib/queries'
import { vatBreakdown } from '@/lib/vat'

/**
 * Our legal identity on the invoice, edited in the Studio (Société / facturation)
 * so it can change without a deploy — none of it is secret, it is printed on every
 * invoice. An invoice without a real tax id is worthless, so an unfilled setting
 * disables invoicing rather than emitting an invalid document.
 */
export async function invoiceSeller(): Promise<InvoiceParty | null> {
  const c = await client.fetch(companySettingsQuery, {}, sanityCache('companySettings'))
  const name = (c?.legalName ?? '').trim()
  const taxId = (c?.taxId ?? '').trim()
  if (!name || !taxId) return null
  return {
    name,
    taxId,
    lines: (c?.address ?? '')
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean),
    email: (c?.email ?? '').trim() || undefined,
  }
}

export const invoicingConfigured = async () => (await invoiceSeller()) !== null

type OrderRow = typeof orders.$inferSelect
type LineRow = Pick<
  typeof orderLines.$inferSelect,
  'productName' | 'variantLabel' | 'unitPriceEur' | 'qty' | 'vatRate'
>

function buildInvoiceData(order: OrderRow, lines: LineRow[], seller: InvoiceParty): InvoiceData {
  const locale = order.locale || 'es'
  const issued = order.paidAt ?? order.createdAt
  const addr = [
    order.shipLine1,
    order.shipLine2,
    [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
    order.shipCountry,
  ].filter(Boolean) as string[]

  const bd = vatBreakdown(lines, order.shippingEur)

  return {
    locale,
    number: order.number,
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(issued)),
    seller,
    buyer: {
      name: order.shipName || order.email,
      lines: addr,
      email: order.email,
    },
    shipTo: order.shipName ? [order.shipName, ...addr] : addr,
    items: lines.map((l) => ({
      name: [l.productName, l.variantLabel].filter(Boolean).join(' — '),
      qty: l.qty,
      unitTtcEur: Number(l.unitPriceEur),
      totalTtcEur: Number(l.unitPriceEur) * l.qty,
    })),
    shippingEur: Number(order.shippingEur),
    buckets: bd.buckets,
    baseEur: bd.baseEur,
    vatEur: bd.vatEur,
    totalEur: bd.totalEur,
    paymentMethod: order.paymentMethod,
  }
}

async function loadLines(orderId: string): Promise<LineRow[]> {
  return db
    .select({
      productName: orderLines.productName,
      variantLabel: orderLines.variantLabel,
      unitPriceEur: orderLines.unitPriceEur,
      qty: orderLines.qty,
      vatRate: orderLines.vatRate,
    })
    .from(orderLines)
    .where(eq(orderLines.orderId, orderId))
}

/** An invoice only exists for a sale that was actually paid. */
const invoiceable = (o: OrderRow) => o.paymentStatus === 'paid'

/** Invoice for one of the signed-in buyer's own orders (looked up by number). */
export async function getUserInvoice(userId: string, number: string): Promise<InvoiceData | null> {
  const seller = await invoiceSeller()
  if (!seller || !userId || !number) return null
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.number, number)))
    .limit(1)
  if (!order || !invoiceable(order)) return null
  return buildInvoiceData(order, await loadLines(order.id), seller)
}

/** Invoice for any order, for the back-office (caller must gate on admin). */
export async function getAdminInvoice(orderId: string): Promise<InvoiceData | null> {
  const seller = await invoiceSeller()
  if (!seller || !orderId) return null
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order || !invoiceable(order)) return null
  return buildInvoiceData(order, await loadLines(order.id), seller)
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  // InvoiceDocument returns a <Document>, but its own props are the invoice data —
  // renderToBuffer types the element by the Document's props, hence the cast.
  const el = createElement(InvoiceDocument, data) as unknown as ReactElement<DocumentProps>
  return renderToBuffer(el)
}

/** Standard response for a rendered invoice (inline so browsers preview it). */
export function invoicePdfResponse(pdf: Uint8Array, number: string): Response {
  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
