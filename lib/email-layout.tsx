import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'
import { emailT } from '@/lib/email-i18n'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// React Email's <Tailwind> uses a v3-style config evaluated at render time
// (independent from the app's Tailwind v4 — no conflict).
const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        void: '#08090c',
        ink: '#0d0f14',
        paper: '#f4f4f5',
        muted: '#a1a1aa',
        gold: '#b08d57',
        stroke: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Arial', 'Helvetica', 'sans-serif'],
        sans: ['Space Grotesk', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
}

export function EmailLayout({
  preheader,
  heading,
  locale,
  children,
}: {
  preheader: string
  heading: string
  locale: string
  children: ReactNode
}) {
  const c = emailT(locale)
  return (
    <Tailwind config={tailwindConfig}>
      <Html lang="fr">
        <Head>
          <meta name="color-scheme" content="dark" />
          <meta name="supported-color-schemes" content="dark" />
          <style>{`@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:300 700;font-display:swap;src:url('${BASE}/fonts/space-grotesk.woff2') format('woff2');}`}</style>
        </Head>
        <Preview>{preheader}</Preview>
        <Body className="bg-void m-0 p-0 font-sans">
          <Container className="bg-ink mx-auto max-w-[600px]">
            <Section className="border-stroke border-b px-8 py-6">
              <Img
                src={`${BASE}/email/logo-tk-white.png`}
                alt="TK Boards"
                width="33"
                height="24"
                className="block"
              />
            </Section>

            <Section className="px-8 pt-12 pb-14">
              <Heading
                as="h1"
                className="font-display text-paper m-0 text-[32px] font-semibold leading-[1.15]"
              >
                {heading}
              </Heading>
              {children}
            </Section>

            <Section className="border-stroke border-t px-8 py-8">
              <Text className="text-muted m-0 text-[12px] leading-[1.6]">
                {c.footer}
                <br />
                {c.footer2}
              </Text>
              <Text className="text-muted m-0 mt-3 text-[12px]">
                <Link href={BASE} className="text-gold">
                  tk-boards.com
                </Link>{' '}
                · © TK Boards
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
