import { Button, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Props = { url: string; locale: string }

function VerifyEmail({ url, locale }: Props) {
  const c = emailT(locale)
  return (
    <EmailLayout preheader={c.verifyPreheader} heading={c.verifyHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">{c.verifyBody}</Text>
      <Section className="mt-8">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.verifyCta}
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

VerifyEmail.PreviewProps = {
  url: 'http://localhost:3000/fr/verify?token=preview-token',
  locale: 'fr',
} as Props

export default VerifyEmail
