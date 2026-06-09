import { Button, Link, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'
import { emailT } from '@/lib/email-i18n'

type Props = { url: string; locale: string }

function ResetPasswordEmail({ url, locale }: Props) {
  const c = emailT(locale)
  return (
    <EmailLayout preheader={c.resetPreheader} heading={c.resetHeading} locale={locale}>
      <Text className="text-muted m-0 mt-2 text-[15px] leading-[1.65]">
        {c.resetBody}
        <br />
        {c.resetBody2}
      </Text>
      <Section className="mt-8">
        <Button
          href={url}
          className="bg-paper text-ink inline-block rounded-md px-6 py-3.5 text-[14px] font-semibold"
        >
          {c.resetCta}
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

ResetPasswordEmail.PreviewProps = {
  url: 'http://localhost:3000/fr/reset-password?token=preview-token',
  locale: 'fr',
} as Props

export default ResetPasswordEmail
