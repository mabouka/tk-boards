import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines } from '@/db/schema'
import InvoiceDocument, { type InvoiceData, type InvoiceParty } from '@/invoices/InvoiceDocument'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { companySettingsQuery } from '@/sanity/lib/queries'
import { vatBreakdown, reconcileBuckets } from '@/lib/vat'
import { countryLabel } from '@/lib/countries'

/**
 * Our legal identity on the invoice, edited in the Studio (Société / facturation)
 * so it can change without a deploy — none of it is secret, it is printed on every
 * invoice. An invoice without a real tax id is worthless, so an unfilled setting
 * disables invoicing rather than emitting an invalid document.
 */
const companySettings = () =>
  client.fetch(companySettingsQuery, {}, sanityCache('companySettings'))

export async function invoiceSeller(): Promise<InvoiceParty | null> {
  const c = await companySettings()
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

/**
 * The logo as a data URI, ready for the PDF.
 *
 * react-pdf only decodes PNG and JPEG, and Sanity serves SVG uploads untouched
 * (its pipeline can't rasterise them), so we check the actual bytes rather than
 * trusting the extension. Anything else — wrong format, asset missing, network
 * hiccup — returns undefined and the invoice falls back to the wordmark. A logo
 * must never be the reason an invoice fails to render.
 */
async function invoiceLogo(): Promise<string | undefined> {
  const c = await companySettings()
  if (!c?.logo) return undefined
  try {
    const url = urlFor(c.logo).width(600).format('png').url()
    const res = await fetch(url)
    if (!res.ok) return undefined
    const bytes = new Uint8Array(await res.arrayBuffer())

    const isPng =
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    if (!isPng && !isJpeg) return undefined // an SVG upload lands here

    const mime = isPng ? 'image/png' : 'image/jpeg'
    return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`
  } catch {
    return undefined
  }
}

type OrderRow = typeof orders.$inferSelect
type LineRow = Pick<
  typeof orderLines.$inferSelect,
  'productName' | 'variantLabel' | 'unitPriceEur' | 'qty' | 'vatRate'
>

/** Order row + lines → everything the PDF prints. Pure (no I/O), and exported so
 *  the money and address rules can be tested without rendering a document. */
export function buildInvoiceData(
  order: OrderRow,
  lines: LineRow[],
  seller: InvoiceParty,
  logo?: string
): InvoiceData {
  const locale = order.locale || 'es'
  const issued = order.paidAt ?? order.createdAt
  const addr = [
    order.shipLine1,
    order.shipLine2,
    [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
    countryLabel(order.shipCountry, locale),
  ].filter(Boolean) as string[]

  const bd = vatBreakdown(lines, order.shippingEur)

  const buyer: InvoiceParty = {
    name: order.shipName || order.email,
    lines: addr,
    email: order.email,
  }
  const deliveredTo: InvoiceParty = { name: order.shipName ?? '', lines: addr }
  const sameAsBilled =
    deliveredTo.lines.length === buyer.lines.length &&
    deliveredTo.lines.every((l, i) => l === buyer.lines[i])

  return {
    locale,
    logo,
    number: order.number,
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(issued)),
    seller,
    buyer,
    // An order carries one address, used both to bill and to deliver, so a "delivered
    // to" block would repeat "billed to" line for line — glaringly, now that the two
    // sit side by side. Printed only when it says something different, which today is
    // never; the day the schema grows a separate billing address, feed it to `buyer`
    // above and this block starts appearing on its own.
    shipTo: sameAsBilled ? null : deliveredTo,
    items: lines.map((l) => ({
      name: [l.productName, l.variantLabel].filter(Boolean).join(' — '),
      qty: l.qty,
      unitTtcEur: Number(l.unitPriceEur),
      totalTtcEur: Number(l.unitPriceEur) * l.qty,
    })),
    shippingEur: Number(order.shippingEur),
    // Per-rate rows are derived from the lines, but the headline figures come from
    // the order itself — an invoice must state the amount that was actually
    // charged, never a total recomputed from rounded unit prices.
    buckets: reconcileBuckets(bd.buckets, Number(order.totalEur), Number(order.taxEur)),
    vatEur: Number(order.taxEur),
    totalEur: Number(order.totalEur),
    baseEur: Number(order.totalEur) - Number(order.taxEur),
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
  return buildInvoiceData(order, await loadLines(order.id), seller, await invoiceLogo())
}

/** Invoice for any order, for the back-office (caller must gate on admin). */
export async function getAdminInvoice(orderId: string): Promise<InvoiceData | null> {
  const seller = await invoiceSeller()
  if (!seller || !orderId) return null
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order || !invoiceable(order)) return null
  return buildInvoiceData(order, await loadLines(order.id), seller, await invoiceLogo())
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
