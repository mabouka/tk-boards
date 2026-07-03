import { Button, Column, Hr, Img, Row, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Attribute = { name: string; value: string; swatchHex: string | null }

type Props = {
  locale: string
  boardName: string | null
  serial: string | null
  photoUrl: string | null
  attributes: Attribute[]
  message: string
  finderEmail: string
  finderPhone?: string
  url: string
}

/**
 * Sent to a board owner when a finder uses the public "contact the owner" form.
 * The finder's email is set as the message's reply-to, so the owner can answer
 * without their own address ever being shown to the finder.
 */
function FoundBoardEmail({
  locale,
  boardName,
  serial,
  photoUrl,
  attributes = [],
  message,
  finderEmail,
  finderPhone,
  url,
}: Props) {
  const c = emailT(locale)

  // Serial + variant axes (color/size…) as one list so they render uniformly.
  const rows: Attribute[] = [
    ...(serial ? [{ name: c.foundSerialLabel, value: serial, swatchHex: null }] : []),
    ...attributes,
  ]

  const contactRow = (label: string, value?: string) =>
    value ? (
      <Text className="text-paper m-0 mt-2 text-[14px] leading-[1.6]">
        <span className="text-muted">{label}: </span>
        {value}
      </Text>
    ) : null

  return (
    <EmailLayout preheader={c.foundPreheader} heading={c.foundHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">{c.foundBody}.</Text>

      {(photoUrl || boardName) && (
        <Section className="mt-6">
          {photoUrl ? (
            <Img
              src={photoUrl}
              alt={boardName ?? ''}
              width="536"
              className="border-stroke block w-full border"
            />
          ) : null}
          <Section className="border-stroke border border-t-0 px-5 py-4">
            {boardName ? (
              <Text className="font-display text-paper m-0 text-[18px] font-semibold uppercase leading-[1.2]">
                {boardName}
              </Text>
            ) : null}
            {rows.map((r, i) => (
              <Row key={i} className="mt-2">
                <Column className="text-muted text-[11px] uppercase tracking-[0.08em]">
                  {r.name}
                </Column>
                <Column className="text-paper text-right text-[14px]">
                  {r.swatchHex ? (
                    <span
                      style={{ backgroundColor: r.swatchHex }}
                      className="mr-[6px] inline-block h-[11px] w-[11px] border border-[rgba(255,255,255,0.25)] align-middle"
                    />
                  ) : null}
                  {r.value}
                </Column>
              </Row>
            ))}
          </Section>
        </Section>
      )}

      <Text className="text-muted m-0 mt-6 text-[12px] uppercase tracking-[0.08em]">
        {c.foundMessageLabel}
      </Text>
      <Text className="text-paper m-0 mt-2 whitespace-pre-line text-[15px] leading-[1.65]">
        {message}
      </Text>

      <Hr className="my-6 border-[#2a2a2a]" />
      <Section>
        {contactRow(c.foundReplyLabel, finderEmail)}
        {contactRow(c.foundPhoneLabel, finderPhone)}
      </Section>

      <Section className="mt-8">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.foundCta}
        </Button>
      </Section>
    </EmailLayout>
  )
}

FoundBoardEmail.PreviewProps = {
  locale: 'fr',
  boardName: 'Rocket',
  serial: 'TK-RKT-0001',
  photoUrl: 'https://cdn.sanity.io/images/placeholder/rocket.jpg',
  attributes: [
    { name: 'Couleur', value: 'Bleu', swatchHex: '#b7bdec' },
    { name: 'Taille', value: '5’10”', swatchHex: null },
  ],
  message: "J'ai retrouvé ta planche à Tarifa, contacte-moi !",
  finderEmail: 'finder@example.com',
  finderPhone: '+33 6 12 34 56 78',
  url: 'http://localhost:3000/fr/tk-id/OCoVcOc0D0cQV0rn',
} as Props

export default FoundBoardEmail
