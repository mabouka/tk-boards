import { Hr, Section, Text } from '@react-email/components'
import { EmailLayout } from '@/lib/email-layout'

type Props = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  product?: string
  message: string
}

/** Internal notification sent to the TK inbox when the contact form is submitted. */
function ContactEmail({ firstName, lastName, email, phone, product, message }: Props) {
  const row = (label: string, value?: string) =>
    value ? (
      <Text className="m-0 mt-2 text-[14px] leading-[1.6]">
        <span className="text-muted">{label}: </span>
        {value}
      </Text>
    ) : null

  return (
    <EmailLayout
      preheader={`New contact message from ${firstName} ${lastName}`}
      heading="New contact message"
      locale="en"
    >
      <Section className="mt-2">
        {row('Name', `${firstName} ${lastName}`)}
        {row('Email', email)}
        {row('Phone', phone)}
        {row('Product', product)}
      </Section>
      <Hr className="my-6 border-[#2a2a2a]" />
      <Text className="text-muted m-0 text-[12px] uppercase tracking-[0.08em]">Message</Text>
      <Text className="m-0 mt-2 whitespace-pre-line text-[15px] leading-[1.65]">{message}</Text>
    </EmailLayout>
  )
}

ContactEmail.PreviewProps = {
  firstName: 'Maxime',
  lastName: 'Lefebvre',
  email: 'maxime@example.com',
  phone: '+33 6 12 34 56 78',
  product: 'Rocket',
  message: 'Hi, I would love to know more about the Rocket in 5’10".',
} as Props

export default ContactEmail
