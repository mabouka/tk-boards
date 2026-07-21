import { Button, Hr, Link, Row, Column, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Line = { name: string; qty: number; total: string }

type Props = {
  locale: string
  orderNumber: string
  lines: Line[]
  subtotal: string
  tax: string
  shipping: string
  total: string
  shipTo: string
  url: string
}

function totalRow(label: string, value: string, strong = false) {
  return (
    <Row className="mt-1">
      <Column className={`text-[13px] ${strong ? 'text-paper font-semibold' : 'text-muted'}`}>{label}</Column>
      <Column
        align="right"
        className={`text-[13px] ${strong ? 'text-paper font-semibold' : 'text-muted'}`}
      >
        {value}
      </Column>
    </Row>
  )
}

function OrderConfirmationEmail({
  locale,
  orderNumber,
  lines,
  subtotal,
  tax,
  shipping,
  total,
  shipTo,
  url,
}: Props) {
  const c = emailT(locale)
  return (
    <EmailLayout preheader={c.orderPreheader} heading={c.orderHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">{c.orderBody}</Text>
      <Text className="text-paper m-0 mt-4 font-mono text-[13px]">#{orderNumber}</Text>

      <Section className="mt-6">
        {lines.map((l, i) => (
          <Row key={i} className="mt-2">
            <Column className="text-paper text-[14px]">
              {l.qty}× {l.name}
            </Column>
            <Column align="right" className="text-paper text-[14px]">
              {l.total}
            </Column>
          </Row>
        ))}
      </Section>

      <Hr className="border-stroke my-5" />

      <Section>
        {totalRow(c.orderSubtotal, subtotal)}
        {totalRow(c.orderTax, tax)}
        {totalRow(c.orderShipping, shipping)}
        {totalRow(c.orderTotal, total, true)}
      </Section>

      <Text className="text-muted m-0 mt-6 text-[13px] leading-[1.6]">
        {c.orderShipTo}
        <br />
        <span className="text-paper">{shipTo}</span>
      </Text>

      <Section className="mt-8">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.orderCta}
        </Button>
      </Section>

      <Text className="text-muted m-0 mt-8 text-[12px] leading-[1.6]">
        {c.fallback}
        <br />
        <Link href={url} className="text-gold break-all">
          {url}
        </Link>
      </Text>
    </EmailLayout>
  )
}

OrderConfirmationEmail.PreviewProps = {
  locale: 'fr',
  orderNumber: 'TK-2026-0001',
  lines: [
    { name: 'TK Rocket', qty: 1, total: '490,00 €' },
    { name: 'Leash Premium', qty: 2, total: '58,00 €' },
  ],
  subtotal: '548,00 €',
  tax: '115,08 €',
  shipping: '25,00 €',
  total: '688,08 €',
  shipTo: '18 rue Hocheporte, 4000 Liège, Belgique',
  url: 'http://localhost:3000/fr/account/orders',
} as Props

export default OrderConfirmationEmail
