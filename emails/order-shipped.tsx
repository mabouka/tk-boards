import { Button, Hr, Link, Row, Column, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Line = { name: string; qty: number }

type Props = {
  locale: string
  orderNumber: string
  carrier: string
  trackingNumber: string
  lines: Line[]
  shipTo: string
  url: string // tracking URL when known, else the account order page
  hasTracking: boolean // whether `url` is a real carrier tracking link
}

function OrderShippedEmail({
  locale,
  orderNumber,
  carrier,
  trackingNumber,
  lines,
  shipTo,
  url,
  hasTracking,
}: Props) {
  const c = emailT(locale)
  return (
    <EmailLayout preheader={c.shipPreheader} heading={c.shipHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">{c.shipBody}</Text>
      <Text className="text-paper m-0 mt-4 font-mono text-[13px]">#{orderNumber}</Text>

      <Section className="border-stroke mt-5 rounded-md border p-4">
        <Row>
          <Column className="text-muted text-[13px]">{c.shipCarrierLabel}</Column>
          <Column align="right" className="text-paper text-[14px]">
            {carrier}
          </Column>
        </Row>
        <Row className="mt-2">
          <Column className="text-muted text-[13px]">{c.shipTrackingLabel}</Column>
          <Column align="right" className="text-paper font-mono text-[13px]">
            {trackingNumber}
          </Column>
        </Row>
      </Section>

      <Section className="mt-6">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {hasTracking ? c.shipCta : c.shipCtaFallback}
        </Button>
      </Section>

      {lines.length > 0 && (
        <>
          <Hr className="border-stroke my-5" />
          <Section>
            {lines.map((l, i) => (
              <Row key={i} className="mt-2">
                <Column className="text-paper text-[14px]">
                  {l.qty}× {l.name}
                </Column>
              </Row>
            ))}
          </Section>
        </>
      )}

      <Text className="text-muted m-0 mt-6 text-[13px] leading-[1.6]">
        {c.orderShipTo}
        <br />
        <span className="text-paper">{shipTo}</span>
      </Text>

      {hasTracking && (
        <Text className="text-muted m-0 mt-8 text-[12px] leading-[1.6]">
          {c.fallback}
          <br />
          <Link href={url} className="text-gold break-all">
            {url}
          </Link>
        </Text>
      )}
    </EmailLayout>
  )
}

OrderShippedEmail.PreviewProps = {
  locale: 'fr',
  orderNumber: 'TK-2026-0001',
  carrier: 'Colissimo',
  trackingNumber: '6A12345678901',
  lines: [
    { name: 'TK Rocket', qty: 1 },
    { name: 'Leash Premium', qty: 2 },
  ],
  shipTo: '18 rue Hocheporte, 4000 Liège, Belgique',
  url: 'https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901',
  hasTracking: true,
} as Props

export default OrderShippedEmail
