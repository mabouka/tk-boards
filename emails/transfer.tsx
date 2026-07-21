import { Button, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'
import { BoardBlock, type BoardAttribute } from './BoardBlock'

type Props = {
  locale: string
  boardName: string | null
  serial: string | null
  photoUrl: string | null
  attributes: BoardAttribute[]
  url: string
}

/** Sent to the invited email when an owner starts an ownership transfer. */
function TransferEmail({ locale, boardName, serial, photoUrl, attributes = [], url }: Props) {
  const c = emailT(locale)
  return (
    <EmailLayout preheader={c.transferPreheader} heading={c.transferHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">{c.transferBody}</Text>

      <BoardBlock
        boardName={boardName}
        serial={serial}
        photoUrl={photoUrl}
        attributes={attributes}
        serialLabel={c.foundSerialLabel}
      />

      <Section className="mt-8">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.transferCta}
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

TransferEmail.PreviewProps = {
  locale: 'fr',
  boardName: 'Rocket',
  serial: 'TK-RKT-0001',
  photoUrl: 'https://cdn.sanity.io/images/placeholder/rocket.jpg',
  attributes: [
    { name: 'Couleur', value: 'Bleu', swatchHex: '#b7bdec' },
    { name: 'Taille', value: '5’10”', swatchHex: null },
  ],
  url: 'http://localhost:3000/fr/transfer?token=preview-token',
} as Props

export default TransferEmail
