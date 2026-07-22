import { Button, Column, Row, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Props = {
  locale: string
  orderNumber: string
  kind: 'cancelled' | 'refunded'
  amount?: string // formatted, shown for refunds
  url: string
}

// Shared "your order changed" notice — cancellation and refund only differ in a
// few strings and the (refund-only) amount box.
function OrderStatusEmail({ locale, orderNumber, kind, amount, url }: Props) {
  const c = emailT(locale)
  const refunded = kind === 'refunded'
  return (
    <EmailLayout
      preheader={refunded ? c.refundPreheader : c.cancelPreheader}
      heading={refunded ? c.refundHeading : c.cancelHeading}
      locale={locale}
    >
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">
        {refunded ? c.refundBody : c.cancelBody}
      </Text>
      <Text className="text-paper m-0 mt-4 font-mono text-[13px]">#{orderNumber}</Text>

      {refunded && amount && (
        <Section className="border-stroke mt-5 rounded-md border p-4">
          <Row>
            <Column className="text-muted text-[13px]">{c.refundAmountLabel}</Column>
            <Column align="right" className="text-paper text-[14px] font-semibold">
              {amount}
            </Column>
          </Row>
        </Section>
      )}

      <Section className="mt-6">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.orderCta}
        </Button>
      </Section>
    </EmailLayout>
  )
}

OrderStatusEmail.PreviewProps = {
  locale: 'fr',
  orderNumber: 'TK-2026-0001',
  kind: 'refunded',
  amount: '688,08 €',
  url: 'http://localhost:3000/fr/account/orders',
} as Props

export default OrderStatusEmail
