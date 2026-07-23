import { describe, expect, it } from 'vitest'
import { buildInvoiceData } from './invoice'
import type { orders, orderLines } from '@/db/schema'
import type { InvoiceParty } from '@/invoices/InvoiceDocument'

type OrderRow = typeof orders.$inferSelect
type LineRow = Pick<
  typeof orderLines.$inferSelect,
  'productName' | 'variantLabel' | 'unitPriceEur' | 'qty' | 'vatRate'
>

const SELLER: InvoiceParty = {
  name: 'TK Boards SL',
  taxId: 'B12345678',
  lines: ['Calle del viento 23', '11380 Tarifa', 'Spain'],
  email: 'info@tk-boards.com',
}

const order = (over: Partial<OrderRow> = {}): OrderRow =>
  ({
    id: 'o1',
    number: 'TK-2026-0010',
    userId: null,
    email: 'buyer@example.com',
    status: 'paid',
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    currency: 'EUR',
    locale: 'fr',
    subtotalEur: '1899.00',
    taxEur: '350.40',
    shippingEur: '120.00',
    totalEur: '2019.00',
    shipName: 'Maxime Lefebvre',
    shipLine1: '18 rue hocheporte',
    shipLine2: 'appartement 01',
    shipPostalCode: '4000',
    shipCity: 'Liège',
    shipCountry: 'BE',
    shipPhone: null,
    carrier: null,
    trackingNumber: null,
    trackingUrl: null,
    stripeSessionId: null,
    stripePaymentIntentId: null,
    createdAt: new Date('2026-07-20T10:00:00Z'),
    paidAt: new Date('2026-07-22T10:00:00Z'),
    shippedAt: null,
    updatedAt: null,
    ...over,
  }) as OrderRow

const line = (over: Partial<LineRow> = {}): LineRow => ({
  productName: 'Rocket',
  variantLabel: "Couleur : Jaune · Taille : 5'10\"",
  unitPriceEur: '1749.00',
  qty: 1,
  vatRate: 21,
  ...over,
})

describe('buildInvoiceData — money', () => {
  // The rule the whole invoice hangs on: an invoice states what was charged. Totals
  // recomputed from rounded unit prices drift by a cent and stop matching Stripe.
  it('takes the headline figures from the order, never from the lines', () => {
    const d = buildInvoiceData(
      order(),
      [line({ unitPriceEur: '1749.005', qty: 3 })], // would recompute to something else
      SELLER
    )
    expect(d.totalEur).toBe(2019)
    expect(d.vatEur).toBe(350.4)
    expect(d.baseEur).toBeCloseTo(1668.6, 2)
  })

  it('makes the VAT rows add up to the charged total', () => {
    const d = buildInvoiceData(order(), [line(), line({ productName: 'Board Bag', unitPriceEur: '150.00' })], SELLER)
    const sum = (k: 'totalEur' | 'vatEur') => d.buckets.reduce((n, b) => n + b[k], 0)
    expect(sum('totalEur')).toBeCloseTo(d.totalEur, 2)
    expect(sum('vatEur')).toBeCloseTo(d.vatEur, 2)
  })

  it('multiplies the line out by quantity', () => {
    const [item] = buildInvoiceData(order(), [line({ unitPriceEur: '150.00', qty: 4 })], SELLER).items
    expect(item.unitTtcEur).toBe(150)
    expect(item.totalTtcEur).toBe(600)
  })
})

describe('buildInvoiceData — addresses', () => {
  it('spells the country out in the order language', () => {
    expect(buildInvoiceData(order(), [line()], SELLER).buyer.lines).toContain('Belgique')
    expect(buildInvoiceData(order({ locale: 'en' }), [line()], SELLER).buyer.lines).toContain('Belgium')
  })

  it('prints the address once, under billing', () => {
    const d = buildInvoiceData(order(), [line()], SELLER)
    expect(d.buyer).toEqual({
      name: 'Maxime Lefebvre',
      lines: ['18 rue hocheporte', 'appartement 01', '4000 Liège', 'Belgique'],
      email: 'buyer@example.com',
    })
  })

  // An order stores one address for both purposes, so a delivery block would be the
  // billing block again — side by side, since the two now share a row.
  it('omits the delivery block while it would repeat the billing one', () => {
    expect(buildInvoiceData(order(), [line()], SELLER).shipTo).toBeNull()
    expect(buildInvoiceData(order({ shipName: null }), [line()], SELLER).shipTo).toBeNull()
  })

  it('drops the delivery block entirely when nothing was collected', () => {
    const bare = order({
      shipName: null,
      shipLine1: null,
      shipLine2: null,
      shipPostalCode: null,
      shipCity: null,
      shipCountry: null,
    })
    expect(buildInvoiceData(bare, [line()], SELLER).shipTo).toBeNull()
  })

  it('bills the email when no name was given', () => {
    expect(buildInvoiceData(order({ shipName: null }), [line()], SELLER).buyer.name).toBe(
      'buyer@example.com'
    )
  })

  it('leaves no empty line where a field is missing', () => {
    const d = buildInvoiceData(order({ shipLine2: null }), [line()], SELLER)
    expect(d.buyer.lines).not.toContain('')
    expect(d.buyer.lines).toEqual(['18 rue hocheporte', '4000 Liège', 'Belgique'])
  })
})

describe('buildInvoiceData — labelling', () => {
  it('names the item by product and the variant actually bought', () => {
    expect(buildInvoiceData(order(), [line()], SELLER).items[0].name).toBe(
      "Rocket — Couleur : Jaune · Taille : 5'10\""
    )
  })

  it('names a variantless item by the product alone', () => {
    expect(buildInvoiceData(order(), [line({ variantLabel: null })], SELLER).items[0].name).toBe('Rocket')
  })

  // The invoice date is the payment date, not the day the order row appeared.
  it('dates the invoice from the payment', () => {
    expect(buildInvoiceData(order(), [line()], SELLER).date).toBe('22 juillet 2026')
  })

  it('falls back to the creation date for an unpaid order', () => {
    expect(buildInvoiceData(order({ paidAt: null }), [line()], SELLER).date).toBe('20 juillet 2026')
  })

  it('formats the date in the order language', () => {
    expect(buildInvoiceData(order({ locale: 'es' }), [line()], SELLER).date).toBe('22 de julio de 2026')
  })
})
