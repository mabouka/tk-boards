import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { invoiceT } from '@/lib/invoice-i18n'
import type { VatBucket } from '@/lib/vat'

export type InvoiceParty = { name: string; taxId?: string; lines: string[]; email?: string }
export type InvoiceItem = { name: string; qty: number; unitTtcEur: number; totalTtcEur: number }

export type InvoiceData = {
  locale: string
  logo?: string // data URI (PNG/JPEG); falls back to the wordmark when absent
  number: string
  date: string // already formatted for the locale
  seller: InvoiceParty
  buyer: InvoiceParty
  shipTo: string[]
  items: InvoiceItem[]
  shippingEur: number
  buckets: VatBucket[]
  baseEur: number
  vatEur: number
  totalEur: number
  paymentMethod: string
}

const s = StyleSheet.create({
  page: { padding: 44, fontSize: 9.5, fontFamily: 'Helvetica', color: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  // Height-constrained so any logo aspect ratio sits on the same baseline.
  logo: { height: 34, maxWidth: 200, objectFit: 'contain' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { marginTop: 6, textAlign: 'right', color: '#555' },
  parties: { flexDirection: 'row', gap: 24, marginTop: 28 },
  party: { flex: 1 },
  label: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: '#777',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  strong: { fontFamily: 'Helvetica-Bold' },
  line: { marginBottom: 1.5 },

  table: { marginTop: 28 },
  thead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingBottom: 5,
  },
  tr: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  cDesc: { flex: 1 },
  cQty: { width: 42, textAlign: 'right' },
  cUnit: { width: 74, textAlign: 'right' },
  cTotal: { width: 78, textAlign: 'right' },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, color: '#777' },

  totals: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsBox: { width: 240 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#111',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },

  vatTable: { marginTop: 26 },
  vatHead: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#bbb', paddingBottom: 4 },
  vatRow: { flexDirection: 'row', paddingVertical: 4 },
  vRate: { width: 60 },
  vCell: { flex: 1, textAlign: 'right' },

  footer: {
    position: 'absolute',
    bottom: 34,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: '#888',
    textAlign: 'center',
  },
})

function Party({ label, party }: { label: string; party: InvoiceParty; }) {
  return (
    <View style={s.party}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.line, s.strong]}>{party.name}</Text>
      {party.lines.map((l, i) => (
        <Text key={i} style={s.line}>
          {l}
        </Text>
      ))}
      {party.email ? <Text style={s.line}>{party.email}</Text> : null}
    </View>
  )
}

export default function InvoiceDocument(d: InvoiceData) {
  const t = invoiceT(d.locale)
  // French/Spanish grouping uses U+202F (narrow no-break space) and U+00A0 before
  // the symbol. The PDF's built-in Helvetica has neither glyph and substitutes a
  // slash — "1/679,00 €" — so normalise them to a plain space.
  const eur = (n: number) =>
    new Intl.NumberFormat(d.locale, { style: 'currency', currency: 'EUR' })
      .format(n)
      .replace(/[\u202F\u00A0]/g, ' ')

  const payment =
    d.paymentMethod === 'cash'
      ? t.paymentCash
      : d.paymentMethod === 'transfer'
        ? t.paymentTransfer
        : t.paymentStripe

  return (
    <Document title={`${t.title} ${d.number}`} author={d.seller.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {d.logo ? (
              // react-pdf's <Image> is not an HTML <img> — a PDF has no alt attribute.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={d.logo} style={s.logo} />
            ) : (
              <Text style={s.brand}>TK BOARDS</Text>
            )}
          </View>
          <View>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.meta}>
              {t.number} {d.number}
            </Text>
            <Text style={s.meta}>
              {t.date} : {d.date}
            </Text>
          </View>
        </View>

        <View style={s.parties}>
          <Party label={t.seller} party={d.seller} />
          <Party label={t.billTo} party={d.buyer} />
        </View>

        {d.shipTo.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={s.label}>{t.shipTo}</Text>
            {d.shipTo.map((l, i) => (
              <Text key={i} style={s.line}>
                {l}
              </Text>
            ))}
          </View>
        )}

        {/* Items */}
        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.cDesc, s.th]}>{t.description}</Text>
            <Text style={[s.cQty, s.th]}>{t.qty}</Text>
            <Text style={[s.cUnit, s.th]}>{t.unitPrice}</Text>
            <Text style={[s.cTotal, s.th]}>{t.lineTotal}</Text>
          </View>
          {d.items.map((it, i) => (
            <View key={i} style={s.tr}>
              <Text style={s.cDesc}>{it.name}</Text>
              <Text style={s.cQty}>{it.qty}</Text>
              <Text style={s.cUnit}>{eur(it.unitTtcEur)}</Text>
              <Text style={s.cTotal}>{eur(it.totalTtcEur)}</Text>
            </View>
          ))}
          {d.shippingEur > 0 && (
            <View style={s.tr}>
              <Text style={s.cDesc}>{t.shipping}</Text>
              <Text style={s.cQty}>1</Text>
              <Text style={s.cUnit}>{eur(d.shippingEur)}</Text>
              <Text style={s.cTotal}>{eur(d.shippingEur)}</Text>
            </View>
          )}
        </View>

        {/* VAT summary — base and cuota per rate */}
        <View style={s.vatTable}>
          <Text style={s.label}>{t.vatSummary}</Text>
          <View style={s.vatHead}>
            <Text style={[s.vRate, s.th]}>{t.rate}</Text>
            <Text style={[s.vCell, s.th]}>{t.base}</Text>
            <Text style={[s.vCell, s.th]}>{t.vat}</Text>
            <Text style={[s.vCell, s.th]}>{t.total}</Text>
          </View>
          {d.buckets.map((b) => (
            <View key={b.rate} style={s.vatRow}>
              <Text style={s.vRate}>{b.rate} %</Text>
              <Text style={s.vCell}>{eur(b.baseEur)}</Text>
              <Text style={s.vCell}>{eur(b.vatEur)}</Text>
              <Text style={s.vCell}>{eur(b.totalEur)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text>{t.base}</Text>
              <Text>{eur(d.baseEur)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>{t.vat}</Text>
              <Text>{eur(d.vatEur)}</Text>
            </View>
            <View style={s.grand}>
              <Text>{t.grandTotal}</Text>
              <Text>{eur(d.totalEur)}</Text>
            </View>
            <View style={[s.totalRow, { marginTop: 8 }]}>
              <Text>{t.paidWith}</Text>
              <Text>{payment}</Text>
            </View>
          </View>
        </View>

        <Text style={s.footer} fixed>
          {d.seller.name} · {t.taxId} {d.seller.taxId} · {t.amountsInclVat}
        </Text>
      </Page>
    </Document>
  )
}
