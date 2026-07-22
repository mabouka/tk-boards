// The invoice is rendered in a route handler, outside the next-intl request
// context, so it carries its own small table keyed by the order's locale.

export type InvoiceLocale = 'fr' | 'en' | 'es'

type InvoiceStrings = {
  title: string
  number: string
  date: string
  seller: string
  billTo: string
  shipTo: string
  taxId: string
  description: string
  qty: string
  unitPrice: string
  lineTotal: string
  shipping: string
  vatSummary: string
  rate: string
  base: string
  vat: string
  total: string
  grandTotal: string
  paidWith: string
  paymentStripe: string
  paymentCash: string
  paymentTransfer: string
  amountsInclVat: string
}

const copy: Record<InvoiceLocale, InvoiceStrings> = {
  fr: {
    title: 'Facture',
    number: 'Facture n°',
    date: 'Date',
    seller: 'Vendeur',
    billTo: 'Facturé à',
    shipTo: 'Livré à',
    taxId: 'NIF/CIF',
    description: 'Désignation',
    qty: 'Qté',
    unitPrice: 'P.U. TTC',
    lineTotal: 'Total TTC',
    shipping: 'Livraison',
    vatSummary: 'Détail de la TVA',
    rate: 'Taux',
    base: 'Base imposable',
    vat: 'TVA',
    total: 'Total',
    grandTotal: 'Total à payer',
    paidWith: 'Règlement',
    paymentStripe: 'Carte bancaire',
    paymentCash: 'Espèces',
    paymentTransfer: 'Virement',
    amountsInclVat: 'Montants exprimés en euros, TVA incluse.',
  },
  en: {
    title: 'Invoice',
    number: 'Invoice no.',
    date: 'Date',
    seller: 'Seller',
    billTo: 'Billed to',
    shipTo: 'Shipped to',
    taxId: 'VAT ID',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit price',
    lineTotal: 'Total',
    shipping: 'Shipping',
    vatSummary: 'VAT summary',
    rate: 'Rate',
    base: 'Taxable base',
    vat: 'VAT',
    total: 'Total',
    grandTotal: 'Total due',
    paidWith: 'Payment',
    paymentStripe: 'Card',
    paymentCash: 'Cash',
    paymentTransfer: 'Bank transfer',
    amountsInclVat: 'Amounts in euros, VAT included.',
  },
  es: {
    title: 'Factura',
    number: 'Factura n.º',
    date: 'Fecha',
    seller: 'Vendedor',
    billTo: 'Facturado a',
    shipTo: 'Enviado a',
    taxId: 'NIF/CIF',
    description: 'Descripción',
    qty: 'Cant.',
    unitPrice: 'P. unitario',
    lineTotal: 'Total',
    shipping: 'Envío',
    vatSummary: 'Desglose del IVA',
    rate: 'Tipo',
    base: 'Base imponible',
    vat: 'Cuota IVA',
    total: 'Total',
    grandTotal: 'Total a pagar',
    paidWith: 'Forma de pago',
    paymentStripe: 'Tarjeta',
    paymentCash: 'Efectivo',
    paymentTransfer: 'Transferencia',
    amountsInclVat: 'Importes en euros, IVA incluido.',
  },
}

export function invoiceT(locale: string): InvoiceStrings {
  const l = (['fr', 'en', 'es'].includes(locale) ? locale : 'es') as InvoiceLocale
  return copy[l]
}
